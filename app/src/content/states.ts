export const states = {
  loading: (what: string) => `Loading ${what}`,
  errorTitle: (what: string) => `Couldn't load ${what}`,
  errorBody: "Something went wrong on the way. Try again.",
  tryAgain: "Try again",
  offlineTitle: "You're offline",
  offlineWithCopy: (time: string) => `Showing the copy on this device. Last synced ${time}.`,
  offlineNoCopy: "Nothing is on this device yet. Connect to load it.",
  offlineWrites: "You're offline. Your adds stay on this device and send later.",
  yourNotes: "your notes",
  thisNote: "this note",
};

export function stateTitle(
  kind: "empty" | "loading" | "error" | "offline",
  what: string = states.yourNotes,
): string | undefined {
  if (kind === "loading") return states.loading(what);
  if (kind === "error") return states.errorTitle(what);
  if (kind === "offline") return states.offlineTitle;
  return undefined;
}
