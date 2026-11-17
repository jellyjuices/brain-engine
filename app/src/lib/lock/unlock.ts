import { forgetLocal } from "./fingerprint.ts";
import { renewSession, writeUnlocked } from "./session.ts";
import { hasVault, resetVault, unlockWithPassword } from "./vault.ts";
import { setNotice } from "./notice.ts";
import { api } from "@/lib/sync/api.ts";
import { count } from "@/lib/sync/outbox.ts";
import { copy } from "@/content/index.ts";

export type UnlockResult = { ok: true } | { ok: false; message: string; wrong?: boolean };

const WRONG: UnlockResult = { ok: false, message: copy.lock.wrong, wrong: true };
const BROKEN: UnlockResult = { ok: false, message: copy.lock.broken };

async function openVault(password: string) {
  if ((await unlockWithPassword(password)) !== "wrong") return;
  const waiting = await count().catch(() => 0);
  await resetVault();
  forgetLocal();
  await unlockWithPassword(password);
  if (waiting > 0) setNotice(copy.lock.passwordChanged);
}

async function unlockOffline(password: string): Promise<UnlockResult> {
  try {
    if (!(await hasVault())) return { ok: false, message: copy.lock.offline };
    if ((await unlockWithPassword(password)) !== "ok") return WRONG;
  } catch {
    return BROKEN;
  }
  writeUnlocked();
  return { ok: true };
}

export async function unlock(password: string): Promise<UnlockResult> {
  const res = await api("/api/unlock", { body: { password }, quiet401: true });
  if (res.ok) {
    try {
      await openVault(password);
    } catch {
      return BROKEN;
    }
    writeUnlocked();
    renewSession();
    return { ok: true };
  }
  if (res.offline) return unlockOffline(password);
  if (res.status === 401) return WRONG;
  if (res.status === 429) {
    const minutes = Math.max(1, Math.ceil((res.retryAfter ?? 60) / 60));
    return {
      ok: false,
      message: minutes === 1 ? copy.lock.tooManyOne : copy.lock.tooManyMany(minutes),
    };
  }
  if (res.status === 503) return { ok: false, message: copy.lock.notSetUp };
  return BROKEN;
}
