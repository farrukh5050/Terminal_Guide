/* ============================================================
   StreetCars Manchester — Services
   ============================================================
   Backend client and view-switching layer used by app.js.

     - api.getBooking({id})        → driver details + tracking link
     - api.requestCallback({...})  → callback / message request
     - showView(name)              → swap the visible <section>

   API_BASE — your backend's URL ('' = same origin).
============================================================ */

const API_BASE = 'https://streetcars-api.streetcars.workers.dev';

/* ============================================================
   API client
   ⚠️ The Autocab subscription key MUST stay on the backend.
   This client just talks to YOUR backend, which proxies to Autocab.
============================================================ */
class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const api = {
  async getBooking(bookingId) {
    const res = await fetch(`${API_BASE}/api/booking/${bookingId}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.status === 404) throw new ApiError('Booking not found', 'not_found');
    if (!res.ok) throw new ApiError('Service unavailable', 'server');
    return res.json();
  },

  async requestCallback({ bookingId, phone, message }) {
    const res = await fetch(`${API_BASE}/api/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, phone, message: message || '' })
    });
    if (!res.ok) throw new ApiError('Could not send', 'server');
    return res.json();
  },

  // DEBUG — for local testing only.
  async getDebugToken() {
    const res = await fetch(`${API_BASE}/api/debug/token`);
    if (!res.ok) throw new ApiError('Token fetch failed', 'server');
    return res.json();
  }
};

/* ============================================================
   View management
   Reads `els.views` and `state.view` defined in app.js.
============================================================ */
function showView(name) {
  Object.entries(els.views).forEach(([key, el]) => { el.hidden = (key !== name); });
  state.view = name;
  window.scrollTo({ top: 0 });
}
