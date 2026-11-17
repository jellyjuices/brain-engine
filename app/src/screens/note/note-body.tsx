import { Markdown } from "@/components/markdown/markdown.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { fieldsOf, LOOPS_HEADING, parseTodoLine } from "@shared/line/index.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import type { ListItem } from "@/lib/notes/markdown.ts";
import { todayIso, type StoredNote } from "@/lib/notes/model.ts";
import { DoneRow } from "./done-row.tsx";

export function NoteBody({ note, hideOpenLoops }: { note: StoredNote; hideOpenLoops: boolean }) {
  function renderTodo(item: ListItem) {
    const parsed = parseTodoLine(`- [${item.checked ? "x" : " "}] ${item.text}`);
    if (!parsed) return null;
    const loop = fieldsOf(parsed);
    if (item.checked) return <DoneRow text={loop.text} />;
    if (item.section !== LOOPS_HEADING.slice(2)) return null;
    return (
      <TodoRow
        todo={makeTodo({ text: loop.text, path: note.path, subject: note.title, due: loop.due })}
        showSubject={false}
        overdue={!!loop.due && loop.due < todayIso()}
      />
    );
  }
  return (
    <Markdown
      src={note.body}
      path={note.path}
      hideOpenLoops={hideOpenLoops}
      renderTodo={renderTodo}
    />
  );
}
