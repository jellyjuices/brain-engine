import { css } from "@linaria/core";
import { CalendarDotsIcon, HashIcon } from "@phosphor-icons/react";
import { typeIcon } from "@/components/icon/icons.ts";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { Suggestion, TriggerKind } from "@/lib/notes/mention.ts";
import { copy } from "@/content/index.ts";

const drawer = css`
  max-height: 40dvh;
  margin: 0 calc(-1 * var(--space-lg));
  padding: var(--space-sm) var(--space-lg);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--background-secondary);
  border-top: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-raised);
`;

function iconOf(s: Suggestion) {
  if (s.kind === "date") return CalendarDotsIcon;
  if (s.kind === "tag") return HashIcon;
  return typeIcon(s.type);
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
    <div className={drawer} onMouseDown={(e) => e.preventDefault()}>
      <List variant="ghost" label={kind === "tag" ? copy.notes.tagList : copy.notes.mentionList}>
        {suggestions.map((s) => (
          <Row key={s.key} icon={iconOf(s)} title={s.title} sub={s.sub} onClick={() => onPick(s)} />
        ))}
      </List>
    </div>
  );
}
