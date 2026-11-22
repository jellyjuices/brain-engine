import styles from "./mention-suggestions.module.css";
import { CalendarDotsIcon, HashIcon } from "@phosphor-icons/react";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import type { Suggestion, TriggerKind } from "@/lib/notes/mention.ts";
import { copy } from "@/content/index.ts";

function iconOf(s: Suggestion) {
  if (s.kind === "date") return CalendarDotsIcon;
  if (s.kind === "tag") return HashIcon;
  return typeLook(s.type).icon;
}

const LABELS = {
  tag: copy.notes.tagList,
  mention: copy.notes.mentionList,
  date: copy.notes.dateList,
};

export function MentionSuggestions({
  kind,
  suggestions,
  onPick,
}: {
  kind: TriggerKind | "date";
  suggestions: Suggestion[];
  onPick: (s: Suggestion) => void;
}) {
  return (
    <div className={styles.mentionSuggestions} onMouseDown={(e) => e.preventDefault()}>
      <List variant="ghost" label={LABELS[kind]}>
        {suggestions.map((s) => (
          <ListRow
            key={s.key}
            icon={iconOf(s)}
            title={s.title}
            sub={s.sub}
            onClick={() => onPick(s)}
          />
        ))}
      </List>
    </div>
  );
}
