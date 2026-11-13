import worker from "../src/index.ts";
import type { Env } from "../src/auth.ts";
import { FakeD1 } from "./fake-d1.ts";

export const PASSWORD = "correct horse";

export interface TestEnv {
  env: Env;
  db: FakeD1;
}

export function makeEnv(overrides: Partial<Env> = {}): TestEnv {
  const db = new FakeD1();
  const env = {
    DB: db as unknown as D1Database,
    PASSWORD,
    SESSION_SECRET: "s3cret",
    RELAY_TOKEN: "relay-tok",
    SERVER_TOKEN: "srv",
    MAC_ORIGIN: "",
    ...overrides,
  } as Env;
  return { env, db };
}

export function call(
  env: Env,
  path: string,
  init: RequestInit & { ip?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("CF-Connecting-IP", init.ip ?? "1.2.3.4");
  return worker.fetch(new Request(`https://brain.test${path}`, { ...init, headers }), env);
}

export function post(body: unknown, headers: Record<string, string> = {}): RequestInit {
  return { method: "POST", body: JSON.stringify(body), headers };
}

export async function login(env: Env): Promise<string> {
  const res = await call(env, "/api/unlock", post({ password: PASSWORD }));
  return (res.headers.get("Set-Cookie") ?? "").split(";")[0];
}
