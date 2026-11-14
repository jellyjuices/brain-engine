import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { makeTodo } from "@/lib/notes/todos.ts";
import { todayIso } from "@/lib/notes/model.ts";
import type { CardTodo } from "@/lib/notes/card-types.ts";

export function CardTodoRow({ todo, subject }: { todo: CardTodo; subject: string }) {
  return (
    <TodoRow
      todo={makeTodo({ ...todo, subject: todo.noteTitle })}
      showSubject={todo.noteTitle !== subject}
      overdue={!!todo.due && todo.due < todayIso()}
    />
  );
}
