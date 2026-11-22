import { useState } from "react";
import { dateSuggestions } from "@/lib/notes/mention.ts";
import { todayIso } from "@/lib/notes/model.ts";

export function useAddDate() {
  const [date, setDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  return {
    date,
    open,
    suggestions: open ? dateSuggestions(todayIso()) : [],
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
    set(value: string) {
      setDate(value);
      setOpen(false);
    },
    clear: () => setDate(null),
  };
}
