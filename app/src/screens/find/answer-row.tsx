import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { noteHref } from "@/lib/notes/model.ts";
import type { AnswerCard } from "@shared/search/index.ts";

export interface AnswerRowProps {
  answer: AnswerCard;
  noteTitle: string;
  onPick: () => void;
}

export function AnswerRow({ answer, noteTitle, onPick }: AnswerRowProps) {
  const sub = answer.date ? `${answer.date} · ${noteTitle}` : noteTitle;
  return (
    <List>
      <ListRow
        href={noteHref(answer.path)}
        title={answer.text.replace(/\s+/g, " ").trim()}
        sub={sub}
        onClick={onPick}
      />
    </List>
  );
}
