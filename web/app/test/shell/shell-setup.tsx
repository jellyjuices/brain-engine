import { render } from "@testing-library/react";
import { vi } from "vitest";
import { startRouter, stopRouter } from "@/lib/platform/router.ts";
import { ShellFrame } from "@/shell/shell-frame/shell-frame.tsx";
import { POPOVER_QUERY, WIDE_QUERY, type ShellLayout } from "@/shell/use-shell-layout.ts";

const MATCHES: Record<ShellLayout, string[]> = {
  phone: [],
  wide: [WIDE_QUERY, POPOVER_QUERY],
  popover: [POPOVER_QUERY],
};

export function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function stubLayout(layout: ShellLayout) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: MATCHES[layout].includes(query),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

export function stubUnsorted(count: number) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(200, { count, items: [] })));
}

export function renderShell(layout: ShellLayout, path = "/today") {
  stubLayout(layout);
  history.replaceState(null, "", path);
  startRouter();
  return render(
    <ShellFrame>
      <p>Screen for 2026-11-05</p>
    </ShellFrame>,
  );
}

export function resetShell() {
  stopRouter();
  vi.unstubAllGlobals();
  vi.useRealTimers();
}
