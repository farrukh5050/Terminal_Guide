import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import worker from '../worker.js';

test('marshal selections persist in SQLite and populate the passenger directions button', async (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(readFileSync(new URL('../schemas.sql', import.meta.url), 'utf8'));

  // Exercise the real SQL through the D1 prepared-statement interface.
  const env = {
    DB: {
      prepare(sql) {
        const statement = db.prepare(sql);
        return {
          bind(...params) {
            return {
              async run() { return statement.run(...params); },
              async first() { return statement.get(...params) ?? null; }
            };
          }
        };
      }
    },
    TELEGRAM_BOT_TOKEN: 'test-token',
    CHAT_ID: 'test-chat',
    TELEGRAM_WEBHOOK_SECRET: 'test-secret'
  };

  // No messages are sent to Telegram during this test.
  const telegramCalls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    telegramCalls.push({ url, body: JSON.parse(options.body) });
    return Response.json({ ok: true });
  });

  const getLocation = async () => {
    const response = await worker.fetch(new Request('https://example.test/api/marshal/location'), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    return response.json();
  };
  assert.deepEqual(await getLocation(), { available: false });

  const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const updateButtonSource = source.match(/async function updateMarshalButton\(\) \{[\s\S]*?\n\}/)[0];
  const els = { marshalBtn: { hidden: true }, marshalBtnLabel: {} };
  const context = { els, api: { getMarshalLocation: getLocation }, t: (_, { spot }) => `Meet our marshal · ${spot}` };

  for (const [spot, coords] of [
    ['starbucks', '53.3684,-2.2805'],
    ['carpark', '53.3691,-2.2821'],
    ['elevators', '53.3680,-2.2787']
  ]) {
    const response = await worker.fetch(new Request('https://example.test/api/telegram-webhook', {
      method: 'POST',
      headers: { 'X-Telegram-Bot-Api-Secret-Token': 'test-secret' },
      body: JSON.stringify({ callback_query: {
        id: `tap-${spot}`, data: `marshal:${spot}`, message: { message_id: 123 }
      } })
    }), env);
    assert.equal(response.status, 200);
    const location = await getLocation();
    assert.equal(location.available, true);
    assert.equal(location.spot, spot);
    assert.equal(new URL(location.mapsUrl).searchParams.get('query'), coords);
    assert.equal(location.updatedAt, db.prepare('SELECT updatedAt FROM settings').get().updatedAt);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM settings').get().count, 1);
    assert.equal(telegramCalls.at(-2).body.callback_query_id, `tap-${spot}`);
    assert.equal(telegramCalls.at(-1).body.reply_markup.inline_keyboard.length, 3);

    await runInNewContext(`${updateButtonSource}\nupdateMarshalButton();`, context);
    assert.equal(els.marshalBtn.hidden, false);
    assert.equal(els.marshalBtn.href, location.mapsUrl);
    assert.ok(els.marshalBtnLabel.textContent.includes(location.label));
  }

  db.prepare('UPDATE settings SET value = ?').run('unknown-spot');
  assert.deepEqual(await getLocation(), { available: false });
  await runInNewContext(`${updateButtonSource}\nupdateMarshalButton();`, context);
  assert.equal(els.marshalBtn.hidden, true);
});

// The webhook is public: the shared secret is all that keeps strangers from
// posting operator replies into a passenger's thread.
test('the Telegram webhook rejects updates without the shared secret', async () => {
  const post = (headers) => worker.fetch(new Request('https://example.test/api/telegram-webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: { message_thread_id: 1, text: 'hi', date: 1 } })
  }), { TELEGRAM_WEBHOOK_SECRET: 'test-secret' });

  assert.equal((await post({})).status, 403);
  assert.equal((await post({ 'X-Telegram-Bot-Api-Secret-Token': 'wrong' })).status, 403);

  // Unset secret must fail closed rather than accept everything.
  const unguarded = await worker.fetch(new Request('https://example.test/api/telegram-webhook', {
    method: 'POST',
    body: JSON.stringify({ message: { message_thread_id: 1, text: 'hi', date: 1 } })
  }), {});
  assert.equal(unguarded.status, 403);
});
