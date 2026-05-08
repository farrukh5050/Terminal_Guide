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
      like  pickup.yourdomain.com/api/*  so the frontend can call
      /api/booking/{id} from the same origin.

   7. In app.js, set USE_MOCK_API = false.
============================================================ */

import { getAutocabToken } from './ghost_session.js';

const ALLOWED_ORIGINS = [
  'https://manair.streetcars.workers.dev',   // production frontend
  'http://localhost:8080'                    // local dev
];

export default {
  async fetch(request, env) {
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

    // GET /api/debug/token — TESTING ONLY, remove before going public
    if (request.method === 'GET' && url.pathname === '/api/debug/token') {
      return handleDebugToken(env, cors);
    }

    return jsonResponse({ error: 'Not found' }, 404, cors);
  }
};

/* ============================================================
   Booking lookup
============================================================ */
async function handleBookingLookup(bookingId, env, cors) {
  if (!env.AUTOCAB_KEY) {
    console.error('AUTOCAB_KEY secret not set');
    return jsonResponse({ error: 'Service not configured' }, 500, cors);
  }

  try {
    // 1. Get the live tracking URL
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

  if (!/^\d{8}$/.test(String(bookingId || ''))) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }
  if (!phone || phone.replace(/\D/g, '').length < 7) {
    return jsonResponse({ error: 'Invalid phone number' }, 400, cors);
  }

  // Forward to your dispatch system. Options:
  //   1. POST to a webhook your office monitors (Slack, Teams, email-to-task)
  //   2. POST to your dispatch software's API to create a callback task
  //   3. Send an email or SMS via a service like Twilio
  //
  // Example: ping a Slack/Teams webhook
  if (env.CALLBACK_WEBHOOK_URL) {
    try {
      await fetch(env.CALLBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📞 Callback request — booking ${bookingId}\n` +
                `Phone: ${phone}` +
                (message ? `\nMessage: ${message}` : '')
        })
      });
    } catch (err) {
      console.error('Webhook delivery failed:', err);
      // Don't fail the request — we've still logged it.
    }
  }

  // Always log to Worker logs so the office can see it via `wrangler tail`
  console.log(JSON.stringify({
    type: 'callback_request',
    bookingId,
    phone,
    message: message || null,
    timestamp: new Date().toISOString()
  }));

  return jsonResponse({ ok: true }, 200, cors);
}

/* ============================================================
   DEBUG — Auth token fetcher (TESTING ONLY)
   Remove this handler and the matching route in fetch() before
   exposing the worker publicly. Anyone who can reach this URL
   can pull a live Autocab portal token.
============================================================ */
async function handleDebugToken(env, cors) {
  if (!env.AUTOCAB_USERNAME || !env.AUTOCAB_PASSWORD) {
    return jsonResponse({ error: 'AUTOCAB_USERNAME / AUTOCAB_PASSWORD not set' }, 500, cors);
  }
  try {
    const { token, apiUrl } = await getAutocabToken(env);
    return jsonResponse({ token, apiUrl }, 200, cors);
  } catch (err) {
    return jsonResponse({ error: err.message || 'Auth failed' }, 502, cors);
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