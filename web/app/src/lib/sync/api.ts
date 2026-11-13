import { copy } from "@/content/index.ts";
export const LOCKED_EVENT = "brain:locked";

export type ApiResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; offline: true }
  | {
      ok: false;
      offline: false;
      status: number;
      error: string;
      retryAfter?: number;
      data?: Record<string, unknown>;
    };

export interface ApiOptions {
  method?: string;
  body?: unknown;
  quiet401?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      headers: opts.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    return { ok: false, offline: true };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 503 && data.offline === true) return { ok: false, offline: true };
  if (res.status === 401 && !opts.quiet401) window.dispatchEvent(new Event(LOCKED_EVENT));
  if (res.ok) return { ok: true, status: res.status, data: data as T };

  const retry = Number(res.headers.get("Retry-After"));
  return {
    ok: false,
    offline: false,
    status: res.status,
    error: typeof data.error === "string" ? data.error : copy.sync.error,
    ...(retry > 0 && { retryAfter: retry }),
    data,
  };
}
