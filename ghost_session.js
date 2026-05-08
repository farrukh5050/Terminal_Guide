/* ============================================================
   Autocab portal authentication (Cloudflare Worker port)
   Converted from ghost_session.py
   ============================================================
   Required secrets:
     wrangler secret put AUTOCAB_USERNAME
     wrangler secret put AUTOCAB_PASSWORD
============================================================ */

const PORTAL_BASE = 'https://portal.autocab365.com';
const COMPANY_ID = '3162';

/**
 * Log in and return { token, apiUrl }.
 * apiUrl is the dynamic base URL Autocab returns — use it for subsequent calls.
 */
export async function getAutocabToken(env) {
  const res = await fetch(`${PORTAL_BASE}/api/v1/login/authenticate`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'text/plain',
      'User-Agent': 'Mozilla/5.0',
      'companyid': COMPANY_ID,
      'username': env.AUTOCAB_USERNAME,
      'password': env.AUTOCAB_PASSWORD,
    },
  });

  if (!res.ok) {
    throw new Error(`Autocab auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return { token: data.token, apiUrl: data.url };
}

/**
 * Headers to attach to every authenticated Autocab call.
 */
export function authHeaders(token) {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0',
    'authentication-token': token,
  };
}
