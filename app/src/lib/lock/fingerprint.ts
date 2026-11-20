import {
  enrollDevice,
  fingerprintCredential,
  forgetFingerprint,
  unlockWithDevice,
} from "./vault.ts";
import { LOCAL } from "@/lib/storage/keys.ts";
import { copy } from "@/content/index.ts";

const TIMEOUT = 60 * 1000;
const ES256 = -7;
const RS256 = -257;

function toB64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64(v: string) {
  const padded = v
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(v.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function random(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}
function isCancel(e: unknown) {
  return e instanceof DOMException && ["NotAllowedError", "AbortError"].includes(e.name);
}

export function isEnrolled() {
  return localStorage.getItem(LOCAL.fingerprintCredential) !== null;
}

export async function isSupported(): Promise<boolean> {
  try {
    return (
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

export async function enroll(): Promise<string | null> {
  if (!(await isSupported())) return copy.lock.fpUnsupported;
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: random(32),
        rp: { name: "Brain", id: location.hostname },
        user: { id: random(16), name: "Brain", displayName: "Brain" },
        pubKeyCredParams: [
          { type: "public-key", alg: ES256 },
          { type: "public-key", alg: RS256 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "discouraged",
          userVerification: "required",
        },
        attestation: "none",
        timeout: TIMEOUT,
      },
    });
    if (!(credential instanceof PublicKeyCredential)) return copy.lock.fpSetupFailed;
    const id = toB64(credential.rawId);
    await enrollDevice(id);
    localStorage.setItem(LOCAL.fingerprintCredential, id);
    return null;
  } catch (e) {
    console.warn("fingerprint enrol failed", e);
    if (e instanceof Error && e.name === "LockedError") return copy.lock.fpRelock;
    return isCancel(e) ? copy.lock.fpSetupCancelled : copy.lock.fpSetupFailed;
  }
}

export function forgetLocal() {
  return localStorage.removeItem(LOCAL.fingerprintCredential);
}

export async function forget(): Promise<void> {
  localStorage.removeItem(LOCAL.fingerprintCredential);
  await forgetFingerprint().catch(() => {});
}

let inFlight = false;

export async function verify(): Promise<string | null> {
  const id = localStorage.getItem(LOCAL.fingerprintCredential);
  if (id === null) return copy.lock.fpNotSetUp;
  if (inFlight) return copy.lock.fpWaiting;
  inFlight = true;
  try {
    if ((await fingerprintCredential()) !== id) {
      localStorage.removeItem(LOCAL.fingerprintCredential);
      return copy.lock.fpReset;
    }
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: random(32),
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: fromB64(id), transports: ["internal"] }],
        userVerification: "required",
        timeout: TIMEOUT,
      },
    });
    if (!(assertion instanceof PublicKeyCredential) || toB64(assertion.rawId) !== id)
      return copy.lock.fpNoMatch;
    return (await unlockWithDevice()) ? null : copy.lock.fpCouldNotOpen;
  } catch (e) {
    console.warn("fingerprint unlock failed", e);
    return isCancel(e) ? copy.lock.fpCancelled : copy.lock.fpUnavailable;
  } finally {
    inFlight = false;
  }
}
