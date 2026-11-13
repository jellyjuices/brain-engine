import { Markdown } from "@/components/markdown/markdown.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { LOOPS_HEADING, makeTodo, parseLoopLine } from "@/lib/notes/loops.ts";
import type { ListItem } from "@/lib/notes/markdown.ts";
import { todayIso, type StoredNote } from "@/lib/notes/model.ts";
import { DoneRow } from "./done-row.tsx";

export function NoteBody({ note, hideOpenLoops }: { note: StoredNote; hideOpenLoops: boolean }) {
  function renderTodo(item: ListItem) {
    const loop = parseLoopLine(`- [${item.checked ? "x" : " "}] ${item.text}`);
    if (!loop) return null;
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
