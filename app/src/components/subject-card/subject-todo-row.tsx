import { TodoRefRow } from "@/components/todo-row/todo-ref-row.tsx";
import { makeTodo } from "@/lib/notes/todos.ts";
import type { CardTodo } from "@/lib/notes/card-types.ts";

export function SubjectTodoRow({ todo, subject }: { todo: CardTodo; subject: string }) {
  return (
    <TodoRefRow
      todo={makeTodo({ ...todo, subject: todo.noteTitle })}
      showSubject={todo.noteTitle !== subject}
    />
  );
}
