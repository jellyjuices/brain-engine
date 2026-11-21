import { configValue } from "../core/home.ts";

export interface HelperConfig {
  url: string;
  model: string;
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

function loopbackUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!LOOPBACK.has(url.hostname)) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

export function helperConfig(): HelperConfig | null {
  const rawUrl = configValue("BRAIN_HELPER_URL")?.trim();
  const model = configValue("BRAIN_HELPER_MODEL")?.trim();
  if (!rawUrl || !model) return null;
  const url = loopbackUrl(rawUrl);
  return url ? { url, model } : null;
}
