import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PORT } from "./server-auth.ts";

export const WEB_URL = (process.env.BRAIN_WEB_URL || `http://127.0.0.1:${DEFAULT_PORT}`).replace(/\/$/, "");
const POPOVER = { w: 400, h: 680 };

function inboxCount(root: string): number {
  const dir = join(root, "inbox");
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).length : 0;
}

export function render(root: string): string {
  const count = inboxCount(root);
  return `${count || ""} | sfimage=scribble href=${WEB_URL}/todos webview=true webvieww=${POPOVER.w} webviewh=${POPOVER.h}`;
}
