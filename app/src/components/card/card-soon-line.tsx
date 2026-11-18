import { List } from "@/components/row/list.tsx";
import { LinkLine } from "./link-line.tsx";
import { CardTodoRow } from "./card-todo-row.tsx";
import type { CardSoon } from "@/lib/notes/card-soon.ts";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export function CardSoonLine({ soon, subject }: { soon: CardSoon; subject: string }) {
  if (soon.kind === "todo")
    return (
      <List variant="ghost">
        <CardTodoRow todo={soon.todo} subject={subject} />
      </List>
    );
  const when = soon.date === todayIso() ? copy.common.today : longDate(soon.date);
  return <LinkLine line={{ path: soon.path, title: soon.text, time: when }} />;
}
