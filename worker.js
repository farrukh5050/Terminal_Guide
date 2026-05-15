/* ============================================================
   StreetCars — Backend Worker
   ============================================================
   Deploys to Cloudflare Workers. Holds your Autocab subscription
   key as a server-side secret. The browser NEVER sees this key.

   ROUTES PROVIDED
     GET  /api/booking/{bookingId}   → look up booking, return safe data
     POST /api/callback              → record callback / message request

   ============================================================
   DEPLOYING (one-off setup)
   ============================================================
   1. Install Wrangler (Cloudflare's CLI):
        npm install -g wrangler
        wrangler login

   2. Create wrangler.toml in the same folder:

        name = "StreetCars-api"
        main = "worker.js"
        compatibility_date = "2025-01-01"

   3. Add your Autocab key as a secret (NOT in the file):
        wrangler secret put AUTOCAB_KEY
        # paste your key when prompted

   4. (Optional) Add a notification webhook for callbacks:
        wrangler secret put CALLBACK_WEBHOOK_URL

   5. Deploy:
        wrangler deploy

   6. In your Cloudflare dashboard, bind the Worker to a route
      worker is binded to url api-manair.bshire.co.uk
      /api/booking/{id} from the same origin.

============================================================ */

const ALLOWED_ORIGINS = [
  'https://pickup.bshire.co.uk',   // production frontend
  'http://localhost:8080'          // local dev
];

/* ============================================================
   Entry point
   The Cloudflare runtime calls `fetch` on the default export
   for every incoming HTTP request. We just delegate to
   handleRequest so the rest of the file can avoid the naming
   collision with the global fetch() used for outbound calls.
============================================================ */
export default {
  fetch: handleRequest
};

async function handleRequest(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(request.url);

  // GET /api/booking/{8-digit-id}
  const bookingMatch = url.pathname.match(/^\/api\/booking\/(\d{8})$/);
  if (request.method === 'GET' && bookingMatch) {
    return handleBookingLookup(bookingMatch[1], env, cors);
  }

  // POST /api/callback
  if (request.method === 'POST' && url.pathname === '/api/callback') {
    return handleCallback(request, env, cors);
  }

  // POST /api/arrived
  if (request.method === 'POST' && url.pathname === '/api/arrived') {
    return handleArrival(request, env, cors);
  }

  return jsonResponse({ error: 'Not found' }, 404, cors);
}

/* ============================================================
   Booking lookup
============================================================ */
async function handleBookingLookup(bookingId, env, cors) {
  if (!env.AUTOCAB_KEY) {
    console.error('AUTOCAB_KEY secret not set');
    return jsonResponse({ error: 'Service not configured' }, 500, cors);
  }

  try {
    // 1. Check to see if the job is Completed or Cancelled before getting the tracking link
    const bookingStatusRes = await fetch(
      `https://autocab-api.azure-api.net/booking/v1/booking/${bookingId}`,
      {headers: { 'Ocp-Apim-Subscription-Key': env.AUTOCAB_KEY }}
    );
    
    if (bookingStatusRes.status === 404) {
      return jsonResponse({ error: 'Booking not found' }, 404, cors);
    }
    if (!bookingStatusRes.ok) {
      return jsonResponse({ error: 'Upstream error' }, 502, cors);
    }

    const bookingStatus = await bookingStatusRes.json();

    // If Autocab has archived this booking (completed, cancelled, etc.),
    // there's no live driver to track. Tell the frontend so it can ask
    // the customer to call us. 410 Gone is the semantically-correct
    // status for "this resource existed but no longer does."
    if (bookingStatus.archivedBooking) {
      return jsonResponse({ error: 'Booking is no longer active' }, 410, cors);
    }

    // 2. Get the live tracking URL
    const trackingRes = await fetch(
      `https://autocab-api.azure-api.net/booking/v1/trackingLink/${bookingId}`,
      { headers: { 'Ocp-Apim-Subscription-Key': env.AUTOCAB_KEY } }
    );

    if (trackingRes.status === 404) {
      return jsonResponse({ error: 'Booking not found' }, 404, cors);
    }
    if (!trackingRes.ok) {
      return jsonResponse({ error: 'Upstream error' }, 502, cors);
    }

    const tracking = await trackingRes.json();

    // 2. TODO: Add a second call here to fetch driver/vehicle details.
    //    Autocab's booking-details endpoint returns driver name, vehicle,
    //    plate, and assigned terminal. Plug it in here, then return them
    //    below instead of the placeholders.
    //
    //    Example:
    //    const detailsRes = await fetch(
    //      `https://autocab-api.azure-api.net/booking/v1/${bookingId}`,
    //      { headers: { 'Ocp-Apim-Subscription-Key': env.AUTOCAB_KEY } }
    //    );
    //    const details = await detailsRes.json();

    // 3. Return ONLY what the browser needs — never proxy raw API output.
    return jsonResponse({
      valid: true,
      bookingId,
      passengerName: '',                       // from details.passengerName
      terminal: null,                          // 'T1' | 'T2' | 'T3' | null
      driver: {
        name:  'Tom Khan',                     // from details.driver.name
        car:   'Blue Skoda Octavia',           // from details.vehicle.make/model
        plate: 'MA21 XYZ',                     // from details.vehicle.registration
        phone: '+441611234567'                 // from details.driver.phone
      },
      trackingUrl: tracking.url
    }, 200, cors);

  } catch (err) {
    console.error('Booking lookup failed:', err);
    return jsonResponse({ error: 'Service unavailable' }, 503, cors);
  }
}

/* ============================================================
  Arrived / message the operators and let them know the passangers is at the waiting spot
============================================================ */
async function handleArrival(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400, cors);
  }

  const { bookingId, terminal } = body || {};

  // bookingId must be a real 8-digit ID — browse-mode "arrivals" are
  // walkthrough exploration, not actual passengers, so the frontend
  // shouldn't be calling this endpoint without one.
  if (!/^\d{8}$/.test(String(bookingId || ''))) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }

  // Forward to Telegram so the office sees the passenger is waiting.
  if (env.TELEGRAM_BOT_TOKEN && env.CHAT_ID) {
    try {
      await sendTelegram(
        env,
        `🚖 Passenger at pickup spot\n` +
        `Booking: ${bookingId}` +
        (terminal ? `\nTerminal: ${terminal}` : '')
      );
    } catch (err) {
      console.error('Telegram delivery failed:', err);
      // Don't fail the request — we've still logged it.
    }
  }

  // Always log to Worker logs so the office can see it via `wrangler tail`
  console.log(JSON.stringify({
    type: 'arrival',
    bookingId,
    terminal: terminal || null,
    timestamp: new Date().toISOString()
  }));

  return jsonResponse({ ok: true }, 200, cors);
}

/* ============================================================
   Callback / message request
============================================================ */
async function handleCallback(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400, cors);
  }

  const { bookingId, phone, message } = body || {};

  // bookingId is optional (browse-mode users have no booking yet). If
  // it IS supplied, it must look like a real 8-digit ID.
  if (bookingId != null && bookingId !== '' && !/^\d{8}$/.test(String(bookingId))) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }
  // Either phone or message is required — both empty makes no sense.
  if (!phone && !message) {
    return jsonResponse({ error: 'Please provide a phone number or a message' }, 400, cors);
  }
  // If a phone IS provided, it must look like a real number.
  if (phone && phone.replace(/\D/g, '').length < 7) {
    return jsonResponse({ error: 'Invalid phone number' }, 400, cors);
  }

  const hasBooking = bookingId != null && bookingId !== '';

  // Forward message to telegram chat
  if (env.TELEGRAM_BOT_TOKEN && env.CHAT_ID) {
    try {
      await sendTelegram(
        env,
        `📞 Callback request\n` +
        `Booking: ${hasBooking ? bookingId : '(no booking — browse mode)'}` +
        (phone   ? `\nPhone: ${phone}`     : '') +
        (message ? `\nMessage: ${message}` : '')
      );
    } catch (err) {
      console.error('Webhook delivery failed:', err);
      // Don't fail the request — we've still logged it.
    }
  }

  // Always log to Worker logs so the office can see it via `wrangler tail`
  console.log(JSON.stringify({
    type: 'callback_request',
    bookingId: hasBooking ? bookingId : null,
    phone,
    message: message || null,
    timestamp: new Date().toISOString()
  }));

  return jsonResponse({ ok: true }, 200, cors);
}


/* ============================================================
  Send message to telegram chat
============================================================ */

async function sendTelegram(env, text){
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: env.CHAT_ID,
      text
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram ${res.status}: ${body}`);
  }
}


/* ============================================================
   Helpers
============================================================ */
function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function jsonResponse(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...cors
    }
  });
}