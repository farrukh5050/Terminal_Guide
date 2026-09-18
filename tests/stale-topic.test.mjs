import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from '../worker.js';

// Operators delete a topic when the job is done. The D1 row survives, so the
// next dispatch for that booking points at a topic Telegram no longer has.
test('a deleted Telegram topic is replaced instead of failing every later dispatch', async (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(readFileSync(new URL('../schemas.sql', import.meta.url), 'utf8'));
  db.prepare('INSERT INTO threads (threadId, convKey, name) VALUES (?, ?, ?)')
    .run(2624, 'booking:18777900', 'BK 18777900 · T2');

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
    CHAT_ID: 'test-chat'
  };

  const sends = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.endsWith('/createForumTopic')) {
      return Response.json({ ok: true, result: { message_thread_id: 9001 } });
    }
    if (url.endsWith('/sendMessage')) {
      sends.push(body.message_thread_id);
      // Telegram's answer for a topic that has been deleted.
      if (body.message_thread_id === 2624) {
        return new Response(
          JSON.stringify({ ok: false, error_code: 400, description: 'Bad Request: message thread not found' }),
          { status: 400 }
        );
      }
    }
    return Response.json({ ok: true, result: {} });
  });

  const response = await worker.fetch(new Request('https://example.test/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: '18777900', terminal: 'T2' })
  }), env);

  assert.equal(response.status, 200);
  // Tried the stale topic, then a freshly created one.
  assert.deepEqual(sends, [2624, 9001]);
  // The mapping now points at the new topic, so replies still find the booking.
  assert.equal(db.prepare('SELECT threadId FROM threads WHERE convKey = ?').get('booking:18777900').threadId, 9001);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM threads').get().count, 1);
});
