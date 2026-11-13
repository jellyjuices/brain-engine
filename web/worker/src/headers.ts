const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

export function jsonError(
  error: string,
  status: number,
  extra: Record<string, string> = {},
): Response {
  return json({ error }, status, extra);
}

export function withHeaders(response: Response, pathname: string): Response {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  if (pathname.startsWith("/api/")) out.headers.set("Cache-Control", "no-store");
  return out;
}
