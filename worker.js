/* ============================================================
   StreetCars — Backend Worker
   ============================================================
   Deploys to Cloudflare Workers. Holds your Autocab subscription
   key as a server-side secret. The browser NEVER sees this key.

   ROUTES PROVIDED
     GET  /api/booking/{bookingId}   → look up booking, return safe data
     POST /api/callback              → record callback / message request
     POST /api/arrived               → passenger arrived at pickup spot
     POST /api/dispatch              → passenger confirmed; office dispatches the car
     POST /api/telegram-webhook      → operator replies inbound from Telegram
     POST /api/chat/send             → passenger → Telegram topic (also stored in KV)
     GET  /api/chat/messages?bookingId=…  → unified chat history for the browser

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

  // POST /api/dispatch — passenger has confirmed; office should dispatch the car.
  if (request.method === 'POST' && url.pathname === '/api/dispatch') {
    return handleDispatch(request, env, cors);
  }

  // POST /api/telegram-webhook — webhook for replying to passengers in the website.
  if (request.method === 'POST' && url.pathname === '/api/telegram-webhook') {
    return handleTelegramWebhook(request, env, cors);
  }

  // POST /api/chat/send — passenger → Telegram topic
  if (request.method === 'POST' && url.pathname === '/api/chat/send') {
    return handleChatSend(request, env, cors);
  }

  // GET /api/chat/messages?bookingId=... — operator replies for the browser to poll
  if (request.method === 'GET' && url.pathname === '/api/chat/messages') {
    return handleChatMessages(request, env, cors);
  }

  return jsonResponse({ error: 'Not found' }, 404, cors);
}

async function handleTelegramWebhook(request, env, cors) {
  const update = await request.json();

  const message = update.message || update.edited_message;

  if (!message || message.from?.is_bot) {
    return jsonResponse({ok: true}, 200, cors)
  }

  // Telegram sends webhook updates for stickers, photos, voice notes, etc.
  // The passenger UI only renders text, so silently drop the rest.
  if (!message.text) {
    return jsonResponse({ok: true}, 200, cors)
  }

  const threadId = message.message_thread_id;
  if (!threadId) {
    return jsonResponse({ok: true}, 200, cors)
  }

  // Telegram's `date` is in seconds; convert to ms so it sorts with passenger
  // messages (which use Date.now()).
  const timestamp = (message.date ? message.date * 1000 : Date.now());

  await putChatMessage(env, threadId, timestamp, 'op', {
    from: 'operator',
    text: message.text,
    timestamp
  });

  return jsonResponse({ ok: true }, 200, cors);
}

/* ============================================================
   Passenger chat — send + retrieve
   Passenger POSTs a message; we forward it into the booking's
   Telegram topic AND persist it in KV so the browser sees its own
   message when it polls. Operator replies are stored by the
   Telegram webhook above. Each message is written to its own KV
   key (see messageKey) so concurrent passenger+operator writes
   never trample each other.
============================================================ */
async function handleChatSend(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400, cors);
  }

  const { bookingId, terminal, message } = body || {};

  if (!/^\d{8}$/.test(String(bookingId || ''))) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }
  if (!message || !String(message).trim()) {
    return jsonResponse({ error: 'Message is required' }, 400, cors);
  }

  const threadId = await getOrCreatePassengerThread(env, bookingId, terminal);
  const trimmed = String(message).trim();
  const timestamp = Date.now();

  await putChatMessage(env, threadId, timestamp, 'px', {
    from: 'passenger',
    text: trimmed,
    timestamp
  });

  await sendMessageToTopic(
    env,
    threadId,
    `💬 Passenger message\n\n` +
    `Booking: ${bookingId}\n` +
    `Terminal: ${terminal || 'Unknown'}\n\n` +
    trimmed
  );

  return jsonResponse({ ok: true, threadId }, 200, cors);
}

async function handleChatMessages(request, env, cors) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');

  if (!bookingId || !/^\d{8}$/.test(bookingId)) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }

  const threadId = await env.CHAT_MESSAGES.get(`booking:${bookingId}:thread`);
  if (!threadId) {
    return jsonResponse({ messages: [] }, 200, cors);
  }

  // Read both: the legacy single-blob key (for threads created before the
  // per-message refactor) and the new per-message keys. New writes only go
  // to per-message keys, so the legacy blob will only contain historical
  // data — never new messages. Merging both keeps old conversations intact.
  //
  // The per-message data lives in each key's metadata (not the value), so
  // a single list() returns every message inline — no N+1 gets per poll.
  const [legacyBlob, list] = await Promise.all([
    env.CHAT_MESSAGES.get(`thread:${threadId}:messages`),
    env.CHAT_MESSAGES.list({ prefix: `thread:${threadId}:msg:` })
  ]);

  const legacy = legacyBlob ? JSON.parse(legacyBlob) : [];

  // Per-message keys: prefer metadata (fast path — already returned by
  // list()). Fall back to fetching the value for keys written before the
  // metadata refactor, so old messages remain visible during the transition.
  const fresh = await Promise.all(
    list.keys.map(async k => {
      if (k.metadata) return k.metadata;
      const v = await env.CHAT_MESSAGES.get(k.name);
      return v ? JSON.parse(v) : null;
    })
  );

  const messages = [...legacy, ...fresh.filter(Boolean)]
    .sort((a, b) => a.timestamp - b.timestamp);

  return jsonResponse({ messages }, 200, cors);
}

/* Per-message KV key. Each message lives at its own key so concurrent
   writers (passenger send + Telegram webhook) never touch the same blob,
   eliminating the read-modify-write race that was dropping messages.
   Timestamp goes first so the key prefix sorts roughly chronologically,
   which is convenient when inspecting KV directly. */
function messageKey(threadId, timestamp, source) {
  const rand = crypto.randomUUID().split('-')[0];
  return `thread:${threadId}:msg:${timestamp}-${source}-${rand}`;
}

/* Store a chat message. The payload goes in the key's METADATA (not the
   value) so a single list() call returns every message inline, avoiding
   the N+1 read pattern that was slowing down poll responses.
   KV metadata caps out at 1024 bytes; chat messages in this app are short
   enough that we don't need a truncation fallback, but if a future feature
   sends long payloads, store the overflow in the value and check a flag. */
async function putChatMessage(env, threadId, timestamp, source, payload) {
  await env.CHAT_MESSAGES.put(
    messageKey(threadId, timestamp, source),
    '',
    { metadata: payload }
  );
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
    // GET DRIVERS DETAILS ONCE THE TAXI IS DISPATCHED
const driverId = bookingStatus.dispatchedBooking?.driverId ?? null;
const vehicleId = bookingStatus.dispatchedBooking?.vehicleId ?? null;

let driverDetails = null;

if (driverId) {
  const driverRes = await fetch(
    `https://autocab-api.azure-api.net/booking/v1/drivers/${driverId}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': env.AUTOCAB_KEY
      }
    }
  );

  if (driverRes.ok) {
    driverDetails = await driverRes.json();
  }
}

const driver = driverId && driverDetails
  ? {
      driverId,
      vehicleId,
      name: `${driverDetails.forename || ''} ${driverDetails.surname || ''}`.trim(),
      car: 'Ford Fiesta',
      plate: 'ABC123',
    }
  : {
      status: 'pending',
      message: 'Driver will be dispatched soon'
    };

    // 3. Return ONLY what the browser needs — never proxy raw API output.
    return jsonResponse({
      valid: true,
      bookingId,
      passengerName: '',                       // from details.passengerName
      terminal: null,                          // 'T1' | 'T2' | 'T3' | null
      driver,
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
      const threadId = await getOrCreatePassengerThread(
        env,
        bookingId,
        terminal
      );

      await sendMessageToTopic(
        env,
        threadId,
        `🚖 Passenger has arrived\n\n` +
        `Booking: ${bookingId}\n` +
        `Terminal: ${terminal || 'Unknown'}`
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
   Dispatch — passenger just confirmed; alert the office to send
   the car. Fires off a high-priority Telegram message.
============================================================ */
async function handleDispatch(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400, cors);
  }

  const { bookingId, terminal } = body || {};

  if (!/^\d{8}$/.test(String(bookingId || ''))) {
    return jsonResponse({ error: 'Invalid booking ID' }, 400, cors);
  }

  if (env.TELEGRAM_BOT_TOKEN && env.CHAT_ID) {
    try {
      const threadId = await getOrCreatePassengerThread(
        env,
        bookingId,
        terminal
      );

      await sendMessageToTopic(
        env,
        threadId,
        `🚨 CUSTOMER HAS ARRIVED - DISPATCH CAR\n` +
        `Booking: ${bookingId}` +
        (terminal ? `\nTerminal: ${terminal}` : '')
      );
    } catch (err) {
      console.error('Telegram delivery failed:', err);
      // Tell the frontend so it can surface a retry — this one matters.
      return jsonResponse({ error: 'Notification failed' }, 502, cors);
    }
  }

  console.log(JSON.stringify({
    type: 'dispatch_request',
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

// Per-booking topic deduplication. The mapping in KV is the source of truth:
// without it, /api/arrived and /api/dispatch each call createForumTopic and
// the operator ends up with two topics per passenger.
async function getOrCreatePassengerThread(env, bookingId, terminal) {
  const key = `booking:${bookingId}:thread`;

  const existingThreadId = await env.CHAT_MESSAGES.get(key);
  if (existingThreadId) return Number(existingThreadId);

  const topic = await createPassengerTopic(env, bookingId, terminal);
  await env.CHAT_MESSAGES.put(key, String(topic.message_thread_id));
  return topic.message_thread_id;
}

async function createPassengerTopic(env, bookingId, terminal) {

  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/createForumTopic`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        name: `BK ${bookingId} · ${terminal || 'Unknown'}`
      })
    }
  );

  const data = await res.json();

  if (!data.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data.result;
}

async function sendMessageToTopic(env, threadId, text) {

  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        message_thread_id: threadId,
        text
      })
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }
}