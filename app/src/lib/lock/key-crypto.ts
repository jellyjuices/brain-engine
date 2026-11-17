export const enc = new TextEncoder();

export function bytes(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(n));
}

export async function passwordKek(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function importDk(raw: Uint8Array<ArrayBuffer>) {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function wrap(kek: CryptoKey, raw: Uint8Array<ArrayBuffer>, aad: string) {
  const iv = bytes(12);
  const wrapped = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(aad) }, kek, raw),
  );
  return { iv, wrapped };
}

export async function unwrap(
  kek: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  wrapped: Uint8Array<ArrayBuffer>,
  aad: string,
): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: enc.encode(aad) },
        kek,
        wrapped,
      ),
    );
  } catch {
    return null;
  }
}
