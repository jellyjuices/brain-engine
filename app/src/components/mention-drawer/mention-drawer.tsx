import styles from "./mention-drawer.module.css";
import { CalendarDotsIcon, HashIcon } from "@phosphor-icons/react";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import type { Suggestion, TriggerKind } from "@/lib/notes/mention.ts";
import { copy } from "@/content/index.ts";

function iconOf(s: Suggestion) {
  if (s.kind === "date") return CalendarDotsIcon;
  if (s.kind === "tag") return HashIcon;
  return typeLook(s.type).icon;
}

export function MentionDrawer({
  kind,
  suggestions,
  onPick,
}: {
  kind: TriggerKind;
  suggestions: Suggestion[];
  onPick: (s: Suggestion) => void;
}) {
  return (
    <div className={styles.mentionDrawer} onMouseDown={(e) => e.preventDefault()}>
      <List variant="ghost" label={kind === "tag" ? copy.notes.tagList : copy.notes.mentionList}>
        {suggestions.map((s) => (
          <Row key={s.key} icon={iconOf(s)} title={s.title} sub={s.sub} onClick={() => onPick(s)} />
        ))}
      </List>
    </div>
  );
}
