import { mentionName } from "@/lib/notes/capture.ts";
import type { Picked } from "@/lib/notes/live-marks.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";

export function pickedText(s: Suggestion, picked: Picked, setDate: (iso: string) => void) {
  if (s.kind === "tag") {
    picked.tags.push(s.value);
    return `#${s.value}`;
  }
  if (s.kind === "subject") {
    const name = mentionName(s);
    picked.names.push(name);
    return `@${name}`;
  }
  setDate(s.value);
  return "";
}
