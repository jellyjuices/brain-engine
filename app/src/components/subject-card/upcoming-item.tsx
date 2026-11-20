import { List } from "@/components/list/list.tsx";
import { NoteLink } from "./note-link.tsx";
import { SubjectTodoRow } from "./subject-todo-row.tsx";
import type { CardSoon } from "@/lib/notes/card-soon.ts";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export function UpcomingItem({ soon, subject }: { soon: CardSoon; subject: string }) {
  if (soon.kind === "todo")
    return (
      <List variant="ghost">
        <SubjectTodoRow todo={soon.todo} subject={subject} />
      </List>
    );
  const when = soon.date === todayIso() ? copy.common.today : longDate(soon.date);
  return <NoteLink line={{ path: soon.path, title: soon.text, time: when }} />;
}
