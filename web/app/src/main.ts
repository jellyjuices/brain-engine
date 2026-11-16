import "@ds/styles/tokens.css";
import "./styles/tokens.css";
import "./styles/base.css";

import { LOCKED_EVENT } from "./lib/sync/api.ts";
import { mountLock } from "./screens/lock/mount-lock.tsx";
import {
  expireSession,
  isUnlocked,
  setOnMac,
  subscribeSession,
  watchSession,
} from "./lib/lock/session.ts";
import { lockVault, unlockOnMac } from "./lib/lock/vault.ts";
import { takeNotice } from "./lib/lock/notice.ts";
import { toast } from "./components/toast/toast-store.ts";
import { trackViewport } from "./lib/platform/viewport.ts";
import { copy } from "@/content/index.ts";

if (location.pathname === "/share")
  history.replaceState(null, "", `/add?${location.search.slice(1)}`);

const app = document.getElementById("app") as HTMLElement;
let unmount: (() => void) | null = null;
let mounting: Promise<void> | null = null;

function lockApp() {
  unmount?.();
  unmount = null;
  app.replaceChildren();
  lockVault();
  document.title = copy.common.appName;
}

function openApp() {
  if (unmount || mounting) return;
  mounting = import("./shell/app.tsx")
    .then(({ mountApp }) => {
      if (isUnlocked() && !unmount) {
        unmount = mountApp(app);
        const notice = takeNotice();
        if (notice) toast(notice, 7000);
      }
    })
    .finally(() => {
      mounting = null;
    });
}

function gate() {
  return isUnlocked() ? openApp() : lockApp();
}

trackViewport();
subscribeSession(gate);

const ON_MAC = document.querySelector('meta[name="brain-local"]') !== null;

async function isPasswordOff(): Promise<boolean> {
  if (!import.meta.env.DEV) return false;
  const res = await fetch("/api/unlock", { credentials: "same-origin" }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as { noPassword?: boolean } | null;
  return data?.noPassword === true;
}

void (async () => {
  if (ON_MAC || (await isPasswordOff())) {
    void unlockOnMac().then(setOnMac, (e) => {
      console.error("Mac unlock failed", e);
      app.textContent = copy.sync.startFailed;
    });
  } else {
    watchSession();
    mountLock();
    window.addEventListener(LOCKED_EVENT, expireSession);
    gate();
  }
})();

if (!ON_MAC && "serviceWorker" in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register("/sw.js").catch(() => {});
}
