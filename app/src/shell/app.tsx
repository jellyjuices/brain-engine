import "@/styles/app.css";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { clearToasts, toast } from "@/components/toast/toast-store.ts";
import { Toasts } from "@/components/toast/toasts.tsx";
import { startRouter, stopRouter } from "@/lib/platform/router.ts";
import { autoFlush } from "@/lib/sync/outbox.ts";
import { startSync, syncNow } from "@/lib/sync/sync.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { ScreenHost } from "./screen-host.tsx";
import { ShellFrame } from "./shell-frame/shell-frame.tsx";
import { copy } from "@/content/index.ts";

registerWrites();

export function App() {
  useEffect(() => {
    startRouter();
    const stopFlush = autoFlush((r) => {
      if (r.dropped.length) toast(copy.save.skipped, { tone: "error" });
      void syncNow({ full: r.dropped.length > 0 });
    });
    const stopSync = startSync();
    return () => {
      stopSync();
      stopFlush();
      stopRouter();
      clearToasts();
    };
  }, []);

  return (
    <>
      <ShellFrame>
        <ScreenHost />
      </ShellFrame>
      <Toasts />
    </>
  );
}

export function mountApp(host: HTMLElement): () => void {
  const root = createRoot(host);
  root.render(<App />);
  return () => {
    root.unmount();
    host.replaceChildren();
  };
}
