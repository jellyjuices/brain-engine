// SwiftBar menu bar plugin: `brain swiftbar` prints one line, the scribble icon and the inbox count.
// A click on the icon opens the web app (web/app) in SwiftBar's popover. Format: https://github.com/swiftbar/SwiftBar#plugin-api
//
// DECISION: the whole menu is the web app. It has the real screens (Add, Find, Today, sort), so the menu has no copy of them.
// DECISION: the app comes from `brain serve` on this Mac, so it needs no internet and no password (server.ts says why that
// is safe). BRAIN_WEB_URL points it at another copy.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PORT } from "./server-auth.ts";

export const WEB_URL = (process.env.BRAIN_WEB_URL || `http://127.0.0.1:${DEFAULT_PORT}`).replace(/\/$/, "");
const POPOVER = { w: 400, h: 680 };

/** Captures waiting in inbox/. */
export function inboxCount(root: string): number {
  const dir = join(root, "inbox");
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).length : 0;
}

/** The menu bar line: the count (none when the inbox is empty), the icon, and the popover to open on click. */
export function render(root: string): string {
  const count = inboxCount(root);
  return `${count || ""} | sfimage=scribble href=${WEB_URL}/today webview=true webvieww=${POPOVER.w} webviewh=${POPOVER.h}`;
}
