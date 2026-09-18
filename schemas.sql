CREATE TABLE threads (
  threadId INTEGER PRIMARY KEY,
  convKey TEXT NOT NULL,       -- booking:12345678 or guest:abcd1234
  name TEXT NOT NULL           -- topic name
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  threadId INTEGER NOT NULL,
  source TEXT NOT NULL,        -- 'px' or 'op'
  fromUser TEXT NOT NULL,      -- 'passenger' or 'operator'
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL   -- ms since epoch
);

CREATE TABLE IF NOT EXISTS settings (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_threads_convkey ON threads(convKey);
CREATE INDEX idx_msg_thread ON messages(threadId, timestamp);