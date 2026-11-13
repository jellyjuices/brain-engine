import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { isUnlocked, subscribeSession } from "@/lib/lock/session.ts";
import { LockScreen } from "./lock.tsx";

export function mountLock() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function draw() {
    flushSync(() => root.render(isUnlocked() ? null : <LockScreen />));
  }
  subscribeSession(draw);
  draw();
}
