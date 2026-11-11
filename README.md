# StreetCars Manchester — Pickup Guidance

A mobile-first web app that takes an arriving passenger from booking ID to
driver, with step-by-step landmarks through Manchester Airport and a live
chat whose operator side is plain Telegram.

## Files

| File | What it is |
|---|---|
| `public/index.html` | Page structure — the views, chat dialog and footer |
| `public/styles.css` | All styling (cream / ink / terracotta palette) |
| `public/app.js` | Front-end logic, state, route data (photos, times), chat polling |
| `public/i18n.js` | Every user-facing string, in 5 languages (EN, ES, AR, 简, 繁) |
| `public/photos/` | Landmark photos for each terminal's steps |
| `worker.js` | **Backend** — Cloudflare Worker: Autocab, Telegram, D1 |
| `schemas.sql` | D1 tables (`threads`, `messages`, `settings`) |
| `tests/` | `node --test` suites, no framework |

## Architecture

```
   Customer's phone
        |
        v
   Cloudflare Worker (worker.js)  <-- serves public/ via [assets]
        |                             holds AUTOCAB_KEY and the Telegram secrets
        +--> Autocab API              booking status, tracking link, driver, vehicle
        +--> Telegram supergroup      one Topic per passenger; operators just reply
        +--> D1 "chat-db"             topic mapping, chat history, marshal location
```

**Why a backend?** The Autocab subscription key cannot live in the browser —
anyone could view-source it and pull other bookings. The Worker holds the
key, validates requests, and returns only what the browser needs. It also
serves the static files, so frontend and API share an origin.

**Why Telegram?** It already provides notifications, threading, mobile apps
and operators who know how to use it. No dispatch dashboard to build, no
training, no commands: a Topic per passenger, and replying in it reaches the
passenger's browser within about 3 seconds.

## User flow

1. **Booking ID** — passenger enters their 8-digit ID. The Worker checks the
   booking is still live (archived/completed ones return 410), fetches the
   tracking URL, and adds driver and vehicle details once a car is dispatched.
2. **Terminal picker** — tapped, or skipped when Autocab already tells us.
3. **Step-by-step landmarks** — short instructions with photos, plus call and
   callback buttons throughout.
4. **Arrived screen** — driver, plate, pickup photo, live tracking link, and
   the chat. If a marshal is on shift, a directions button points at the spot
   they last selected in Telegram.

Passengers without a booking (or who open chat from the footer) get a guest
conversation keyed to a localStorage ID, so their thread survives a reload.

## Running it locally

```bash
npx wrangler dev
```

Serves `public/` and the API together on `http://localhost:8787`. The
frontend targets `localhost:8787` automatically when the page is on
localhost.

Local dev needs `.dev.vars` (never committed) with `AUTOCAB_KEY`,
`TELEGRAM_BOT_TOKEN`, `CHAT_ID` and `TELEGRAM_WEBHOOK_SECRET`, plus the D1
schema applied to the local database:

```bash
npx wrangler d1 execute chat-db --local --file=schemas.sql
```

Telegram cannot reach localhost, so operator replies only arrive against the
deployed Worker.

## Deploying

```bash
npx wrangler secret put AUTOCAB_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put CHAT_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler d1 execute chat-db --remote --file=schemas.sql
npx wrangler deploy
```

Then register the Telegram webhook with the same `TELEGRAM_WEBHOOK_SECRET`
and `allowed_updates` of `["message","callback_query"]` — see
`.claude/CLAUDE.md` for the PowerShell command and the debugging order when
replies stop arriving.

`wrangler secret put` only works on a Worker that already exists, so deploy
once first.

## Tests

```bash
node --test tests/
```

Plain `node:test` with `node:sqlite` standing in for D1, so the real SQL runs.

## Customising

- **Copy** — all of it is in `public/i18n.js`, including the walking
  instructions (`route.<key>.*` keys). `public/app.js` holds only the
  untranslatable route data: photos, walking times, badge colours.
- **Photos** — `public/photos/`, roughly 1200x900 and under 200KB each. Walk
  each terminal, shoot at every decision point.
- **Look** — colour and type variables sit at the top of `public/styles.css`
  (`--ink`, `--bg`, `--accent`). Fonts load from Google Fonts.
