import { useSyncExternalStore } from "react";

export type ShellLayout = "phone" | "wide" | "popover";

export const WIDE_QUERY = "(min-width: 48rem)";
export const POPOVER_QUERY = "(hover: hover) and (pointer: fine)";

function readLayout(): ShellLayout {
  if (matchMedia(WIDE_QUERY).matches) return "wide";
  return matchMedia(POPOVER_QUERY).matches ? "popover" : "phone";
}

function subscribeLayout(onChange: () => void): () => void {
  const lists = [matchMedia(WIDE_QUERY), matchMedia(POPOVER_QUERY)];
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

export function useShellLayout(): ShellLayout {
  return useSyncExternalStore(subscribeLayout, readLayout);
}
