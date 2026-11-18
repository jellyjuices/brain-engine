import { Markdown } from "@/components/markdown/markdown.tsx";
import { TodoRefRow } from "@/components/todo-row/todo-ref-row.tsx";
import { fieldsOf, LOOPS_HEADING, parseTodoLine } from "@shared/line/index.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import type { ListItem } from "@/lib/notes/markdown.ts";
import type { StoredNote } from "@/lib/notes/model.ts";

function isDropped(line: string) {
  const todo = parseTodoLine(line);
  return !!todo && !!fieldsOf(todo).dropped;
}

export function NoteBody({ note }: { note: StoredNote }) {
  function renderTodo(item: ListItem) {
    if (item.section !== LOOPS_HEADING.slice(2)) return null;
    const parsed = parseTodoLine(`- [${item.checked ? "x" : " "}] ${item.text}`);
    if (!parsed) return null;
    const loop = fieldsOf(parsed);
    return (
      <TodoRefRow
        todo={makeTodo({
          text: loop.text,
          path: note.path,
          subject: note.title,
          due: loop.due,
          every: loop.every,
        })}
        showSubject={false}
        done={loop.done}
        tickNow
      />
    );
  }
  const shown = note.body
    .split("\n")
    .filter((line) => !isDropped(line))
    .join("\n");
  return <Markdown src={shown} path={note.path} renderTodo={renderTodo} />;
}
