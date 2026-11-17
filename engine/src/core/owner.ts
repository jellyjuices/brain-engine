import { configValue } from "./home.ts";

export const OWNER_BY = "owner";

export function ownerWriters(): string[] {
  const aliases = process.env.BRAIN_OWNER_ALIASES ?? configValue("BRAIN_OWNER_ALIASES") ?? "";
  return [OWNER_BY, ...aliases.split(",").map((a) => a.trim()).filter(Boolean)];
}

export function isOwnerWriter(by: unknown): boolean {
  const name = String(by ?? "");
  return ownerWriters().some((owner) => name.startsWith(owner));
}
