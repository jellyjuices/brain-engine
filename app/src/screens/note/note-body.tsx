import { Markdown } from "@/components/markdown/markdown.tsx";
import { TodoRefRow } from "@/components/todo-row/todo-ref-row.tsx";
import { fieldsOf, LOOPS_HEADING, parseTodoLine } from "@shared/line/index.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import type { ListItem } from "@/lib/notes/markdown.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { PlainCheck } from "@/components/markdown/plain-check.tsx";

export function NoteBody({ note, hideOpenLoops }: { note: StoredNote; hideOpenLoops: boolean }) {
  function renderTodo(item: ListItem) {
    const parsed = parseTodoLine(`- [${item.checked ? "x" : " "}] ${item.text}`);
    if (!parsed) return null;
    const loop = fieldsOf(parsed);
    if (item.checked) return <PlainCheck text={loop.text} checked from={note.path} />;
    if (item.section !== LOOPS_HEADING.slice(2)) return null;
    return (
      <TodoRefRow
        todo={makeTodo({ text: loop.text, path: note.path, subject: note.title, due: loop.due })}
        showSubject={false}
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
