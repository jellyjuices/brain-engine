import type { Card, CardTodo } from "./card-types.ts";

export type CardSoon =
  { kind: "todo"; todo: CardTodo } | { kind: "event"; date: string; text: string; path: string };

function soonestTodo(todos: CardTodo[]): CardTodo | undefined {
  const dated = todos.filter((t) => t.due).sort((a, b) => a.due!.localeCompare(b.due!));
  return dated[0] ?? todos[0];
}

export function soonOf(card: Card): CardSoon | undefined {
  const todo = soonestTodo(card.todo);
  const next = card.next;
  const nextIsTodo = next && card.todo.some((t) => t.path === next.path && t.text === next.text);
  const eventFirst = next && !nextIsTodo && (!todo?.due || next.date <= todo.due);
  if (eventFirst) return { kind: "event", ...next };
  return todo && { kind: "todo", todo };
}
