CREATE TABLE IF NOT EXISTS inbox (
  client_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  received_at INTEGER NOT NULL,
  into_path TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  first_at INTEGER NOT NULL
);
