interface Attempt {
  count: number;
  first_at: number;
}
interface InboxRow {
  client_id: string;
  created_at: string;
  text: string;
  tags: string;
  received_at: number;
  into_path: string | null;
}

export class FakeD1 {
  attempts = new Map<string, Attempt>();
  inbox = new Map<string, InboxRow>();

  prepare(sql: string) {
    return new FakeStatement(this, sql.replace(/\s+/g, " ").trim(), []);
  }
}

class FakeStatement {
  db: FakeD1;
  sql: string;
  args: unknown[];

  constructor(db: FakeD1, sql: string, args: unknown[]) {
    this.db = db;
    this.sql = sql;
    this.args = args;
  }

  bind(...args: unknown[]) {
    return new FakeStatement(this.db, this.sql, args);
  }

  async first<T>(): Promise<T | null> {
    const [a] = this.args as [string];
    if (this.sql.startsWith("SELECT count, first_at FROM login_attempts"))
      return (this.db.attempts.get(a) as T) ?? null;
    if (this.sql.startsWith("SELECT client_id, received_at FROM inbox"))
      return (this.db.inbox.get(a) as T) ?? null;
    throw new Error(`FakeD1 first: unknown SQL ${this.sql}`);
  }

  async all<T>(): Promise<{ results: T[] }> {
    if (
      this.sql.startsWith(
        "SELECT client_id, created_at, text, tags, received_at, into_path FROM inbox ORDER BY received_at ASC",
      )
    ) {
      const rows = [...this.db.inbox.values()].sort((x, y) => x.received_at - y.received_at);
      return { results: rows as T[] };
    }
    throw new Error(`FakeD1 all: unknown SQL ${this.sql}`);
  }

  async run(): Promise<{ success: true }> {
    const [a, b, c, d, e, f] = this.args as [string, string, string, string, number, string | null];
    if (this.sql.startsWith("INSERT INTO login_attempts")) {
      const row = this.db.attempts.get(a);
      this.db.attempts.set(
        a,
        row ? { ...row, count: row.count + 1 } : { count: 1, first_at: b as unknown as number },
      );
    } else if (this.sql.startsWith("DELETE FROM login_attempts")) {
      this.db.attempts.delete(a);
    } else if (this.sql.startsWith("INSERT OR IGNORE INTO inbox")) {
      if (!this.db.inbox.has(a))
        this.db.inbox.set(a, {
          client_id: a,
          created_at: b,
          text: c,
          tags: d,
          received_at: e,
          into_path: f ?? null,
        });
    } else if (this.sql.startsWith("DELETE FROM inbox")) {
      this.db.inbox.delete(a);
    } else {
      throw new Error(`FakeD1 run: unknown SQL ${this.sql}`);
    }
    return { success: true };
  }
}
