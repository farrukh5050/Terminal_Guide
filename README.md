# StreetCars Manchester — Pickup Guidance

A lightweight, mobile-first web app that takes an arriving passenger from booking ID to driver, with step-by-step landmarks through Manchester Airport.

## Files

| File          | What it is                                                       |
|---------------|------------------------------------------------------------------|
| `index.html`  | Page structure — four views and a callback dialog                |
| `styles.css`  | All styling (cream / ink / terracotta palette)                   |
| `app.js`      | Front-end logic, state, route data, mock API for development     |
| `worker.js`   | **Backend** — Cloudflare Worker that proxies to Autocab          |
| `README.md`   | This file                                                        |

## Architecture (read this first)

```
   Customer's phone
        │
        ▼
   Static site  (index.html, styles.css, app.js)
        │   fetch('/api/booking/12345678')
        ▼
   Cloudflare Worker  (worker.js)  ◄─── holds AUTOCAB_KEY (server-side secret)
        │
        ▼
   Autocab API
```

**Why a backend?** The Autocab subscription key cannot live in the browser. If it did, anyone could view-source, copy it, and hammer the API or pull other bookings. The Worker holds the key, validates requests, and returns only the data the browser needs.

## User flow

1. **Booking ID** — passenger enters their 8-digit ID. The Worker calls Autocab, validates the booking, and returns driver/vehicle info plus a live tracking URL.
2. **Terminal picker** — they tap their terminal (skipped if Autocab tells us which one is assigned).
3. **Step-by-step landmarks** — 3–5 short instructions with photos. Every step has a "Call" button (rings the driver) and a "Request callback" button (opens the dialog).
4. **Callback dialog** — passenger enters their phone number for a callback, or toggles to send a written message instead.
5. **Arrived screen** — driver name, plate, photo of the pickup spot, "Track driver live" link (Autocab tracking URL), one-tap call/text.

## Setting it up locally

You can run the front-end as static files with no backend, using the mock API:

1. Make sure `USE_MOCK_API = true` is set at the top of `app.js`.
2. Open `index.html` in a browser, or run `python3 -m http.server 8080` in the folder.
3. Enter any 8-digit number except `00000000` (which simulates "booking not found") to step through the flow.

## Deploying for real

### 1. Frontend — Cloudflare Pages

Drag-drop the folder at [pages.cloudflare.com](https://pages.cloudflare.com) or connect a Git repo. Set a custom domain like `pickup.streetcars.co.uk`.

### 2. Backend — Cloudflare Worker

```bash
npm install -g wrangler
wrangler login
```

Create `wrangler.toml` next to `worker.js`:

```toml
name = "streetcars-api"
main = "worker.js"
compatibility_date = "2025-01-01"
```

Add your Autocab subscription key as a secret (never commit it):

```bash
wrangler secret put AUTOCAB_KEY
# paste your key when prompted
```

Optionally add a webhook URL so callback requests ping your office (Slack, Teams, anything that takes an incoming webhook):

```bash
wrangler secret put CALLBACK_WEBHOOK_URL
```

Deploy:

```bash
wrangler deploy
```

In the Cloudflare dashboard, bind the Worker to a route like `pickup.streetcars.co.uk/api/*`. The frontend's `fetch('/api/booking/12345678')` will then go straight to the Worker because they share an origin.

### 3. Switch off mock mode

In `app.js`:

```js
const USE_MOCK_API = false;
```

Re-deploy the frontend. You're live.

## What still needs your attention

The Worker's `handleBookingLookup` currently returns placeholder driver info because the Autocab `trackingLink` endpoint only returns the tracking URL. To fetch real driver name, vehicle, plate, and phone you'll need to call your dispatch system's booking-details endpoint as well — there's a clearly marked `TODO` block in `worker.js` showing where to plug it in. Ask Autocab support which endpoint returns those fields for your subscription.

The walking instructions in `app.js` (`ROUTES` object) are plausible-sounding examples. Walk each terminal yourself, take photos at each decision point, edit the step text, and host the photos somewhere (Cloudflare R2, S3, Cloudinary). Recommended dimensions: 1200×900, under 200KB each.

## Customising the look

Colour and typography variables are at the top of `styles.css`. Change `--ink`, `--bg`, and `--accent` to match your brand colours. Fonts (Fraunces + Geist) load from Google Fonts.
