# CLAUDE.md

Project context for future Claude (or developer) sessions. Read this before making changes.

## What this is

A web app that helps Manchester Airport arrivals find their pre-booked StreetCars driver. Flow: customer enters 8-digit booking ID → picks terminal → walks through photo-led step instructions → arrives at pickup spot with driver info and live tracking link.

The customer is tired, possibly jet-lagged, on poor airport WiFi or expensive roaming, carrying bags, and may not speak English as a first language. Every design choice should be measured against that.

## Stack and why

- **Frontend:** vanilla HTML/CSS/JS. No framework, no build step, no npm.
- **Backend:** Cloudflare Worker (`worker.js`) that proxies to the Autocab dispatch API.
- **Hosting:** Cloudflare Pages (static) + Workers (API).

Why no framework: bundle size matters more than DX here. Total page weight is under 30KB before photos. The logic is a simple state machine — picking from a list, stepping through an array, showing an arrival screen. A framework would add weight without buying anything. If we add real-time driver location, multi-language, or customer accounts, **that's** the time to reconsider — not before.

## Files

| File         | Purpose                                                                  |
|--------------|--------------------------------------------------------------------------|
| `index.html` | Four views (booking, picker, nav, arrived) + callback `<dialog>`         |
| `styles.css` | All styling. Design tokens in `:root` at the top                         |
| `app.js`     | State machine, `ROUTES` data, API client, dialog logic                   |
| `worker.js`  | Cloudflare Worker — Autocab proxy + callback endpoint                    |
| `README.md`  | Operator-facing deployment instructions                                  |
| `CLAUDE.md`  | This file                                                                |

## Critical security rule

**The Autocab subscription key MUST NEVER appear in client code, URL params, query strings, or anywhere the browser can see.** It lives only as a Cloudflare Worker secret (`env.AUTOCAB_KEY`). The frontend hits `/api/booking/{id}`; the Worker is the only thing that talks to Autocab.

If you ever find yourself thinking "I'll just put it in app.js for a quick test" — don't. Use `wrangler dev` for local testing instead. Once that key leaks it can be used to query any booking and rack up API charges.

## View model

Single-page app, four views switched by `showView(name)`:

1. **`booking`** — 8-digit booking ID entry. Validates locally, then calls `/api/booking/{id}`.
2. **`picker`** — terminal selection. Skipped automatically if the Autocab response includes an assigned terminal.
3. **`nav`** — step-by-step landmarks. Always has the call + callback contact bar at the bottom.
4. **`arrived`** — driver card, pickup-spot photo, "Track driver live" link, call/callback actions.

State lives in the `state` object in `app.js`. The History API (`pushState` / `popstate`) backs the browser back button — no router, no hash routing. State is in-memory only; a refresh restarts the journey (acceptable: passenger just re-enters the booking ID).

## Route data

The `ROUTES` object near the top of `app.js` is the single source of truth for walking instructions. Each terminal has:

- `name`, `detail`, `badgeColour`
- `steps[]` — each with `instruction` (short imperative), `detail` (one-sentence context with a landmark), `time` (e.g. `'60s'`), `direction` (`forward` / `left` / `right` / `up` / `down` / `back`), `photo` (URL or `null`)
- `pickup` — final destination info: `spot`, `detail`, `photo`

Direction strings map to arrow SVG paths in `ARROW_PATHS`. Until real photos are supplied, each step renders a styled placeholder with the directional arrow overlaid. Setting `step.photo = 'https://…'` swaps it for a real image automatically.

## Mock vs real API

`USE_MOCK_API` flag at the top of `app.js`:

- `true` (default) — returns realistic responses after a 600ms delay. Booking ID `00000000` triggers the "not found" path for testing. Use this while developing without a deployed Worker.
- `false` — hits the real Worker at `${API_BASE}/api/booking/{id}`. Set this when going live.

## Design tokens

All in `:root` at the top of `styles.css`. Palette is warm cream (`--bg`), deep ink (`--ink`) for primary actions, terracotta (`--accent`) reserved for the arrival moment, success green for the call button, danger red for errors. Typography: Fraunces (display, used sparingly for headings) + Geist (body) — both from Google Fonts.

Two font weights only — 400 and 500. No 600/700; they look heavy and undermine the calm tone.

## Things to preserve when changing things

- **Mobile-first.** Container caps at 480px. All touch targets ≥48px. Test in mobile emulator before desktop.
- **Accessibility.** `aria-label` on icon-only buttons, `role="alert"` on inline errors, `prefers-reduced-motion` respected (animations are nuked under that media query). Dialog uses the native `<dialog>` element so it's keyboard-accessible and traps focus correctly.
- **No external JS dependencies.** No npm. No build step. Three static files plus the Worker.
- **Contact bar on every step**, not just at the end. People get lost mid-journey, and "I'll just keep walking" is not a recovery strategy.
- **Loading states on every async action.** Continue button, callback submit. Use the `setLoading(btn, true/false)` helper.
- **Errors are inline and human.** Never `alert()`. Show the error in `.booking-form__error` or `.dialog__error`.

## Things still TODO (priority order)

1. **Real driver/vehicle lookup in `worker.js`.** The Autocab `trackingLink` endpoint returns only the URL. There's a marked `TODO` block in `handleBookingLookup()` showing where to add the second call to the booking-details endpoint. Driver name, car, plate, and phone currently come back as hard-coded placeholders. Confirm with Autocab support which endpoint exposes those fields for this subscription.
2. **Real photos for each step.** The `ROUTES` step text is plausible but unverified. Walk each terminal at average passenger pace, shoot a photo from eye level at every decision point, add an arrow overlay in any image editor, host them somewhere (R2, S3, Cloudinary), set `step.photo` to the URL. Aim for 1200×900, <200KB each.
3. **Terminal pre-fill.** If Autocab returns the assigned terminal in booking details, surface it as `terminal: 'T2'` in the Worker response. The frontend already auto-skips the picker when this is set.
4. **Callback delivery.** Currently logs to Worker logs and optionally pings `CALLBACK_WEBHOOK_URL`. Decide where the office actually wants these — Slack/Teams webhook is the obvious starting point, but it could equally create a task in the dispatch system.

## Common tasks

**Add or edit a step:** Open `app.js`, edit the relevant terminal's `steps` array in `ROUTES`. Reload.

**Change colours:** Edit `--ink`, `--bg`, `--accent` in `styles.css` `:root`.

**Test the not-found error path:** Enter booking ID `00000000` while `USE_MOCK_API = true`.

**Test locally:** `python3 -m http.server 8080` from the project folder, then visit `http://localhost:8080`.

**Test the Worker locally with the real Autocab key:**
```bash
wrangler secret put AUTOCAB_KEY  # one-off
wrangler dev
```

**Deploy frontend:** drag the folder into Cloudflare Pages (or push to the connected Git repo).

**Deploy Worker:** `wrangler deploy`. Make sure the route binding in the Cloudflare dashboard points `pickup.yourdomain.com/api/*` at the Worker.

## Conventions

- BEM-ish CSS class names: `.block`, `.block__element`, `.block--modifier`.
- IDs for JS hooks, classes for styles. Don't mix.
- Functions in `app.js` are grouped by view in commented sections — keep that structure.
- Comments explain **why**, not **what**. The code shows what.
- Two-space indentation everywhere.

## When extending

Before adding a feature, ask: does this need to live in the customer's browser, or could it be an operator-side tool? Customer-side, every kilobyte costs someone roaming data. Operator-side, build a separate admin tool — don't bloat this one.

If adding persistent state across refreshes, use `sessionStorage`, not `localStorage` (the booking is single-trip).

If adding an API endpoint, follow the pattern in `worker.js`: validate input, never proxy raw Autocab errors back to the browser, return only what the frontend needs.

If reaching for a framework or build step, stop and reconsider — that's a one-way door.
