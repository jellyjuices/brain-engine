export const DB_NAME = "brain";

export const STORE = {
  outbox: "outbox",
  notes: "notes",
  meta: "meta",
  keys: "keys",
} as const;

export const META = {
  lastSync: "lastSync",
  recentSearches: "recent",
  conflicts: "conflicts",
  draft: "draft:",
} as const;

export const SESSION = {
  unlockedUntil: "brain:unlocked-until",
  lapsed: "brain:session-lapsed",
} as const;

export const LOCAL = {
  fingerprintCredential: "brain:fingerprint-credential",
  legacyRecent: "brain.recent",
} as const;
