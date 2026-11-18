import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { openLayer } from "@/lib/platform/back-stack.ts";
import { copy } from "@/content/index.ts";
import { Sheet } from "./sheet.tsx";

const LEAVE_MS = 160;

export type Finish<T> = (value: T | null) => void;

export function openSheet<T>(
  title: string,
  render: (finish: Finish<T>) => ReactNode,
): Promise<T | null> {
  return new Promise((resolve) => {
    const previous = document.activeElement as HTMLElement | null;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let closed = false;
    const release = openLayer(() => finish(null));

    function finish(value: T | null) {
      if (closed) return;
      closed = true;
      release();
      draw(true);
      setTimeout(() => {
        root.unmount();
        host.remove();
        previous?.focus?.();
      }, LEAVE_MS);
      resolve(value);
    }

    function draw(leaving: boolean) {
      root.render(
        <Sheet
          open={!leaving}
          onOpenChange={(open) => open || finish(null)}
          title={title}
          hideTitle
          closeLabel={copy.common.close}
        >
          {render(finish)}
        </Sheet>,
      );
    }

    draw(false);
  });
}
