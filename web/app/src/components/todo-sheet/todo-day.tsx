import { WhenPicker } from "@/components/when-picker/when-picker.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export function TodoDay({ todo, now, finish, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHead todo={todo} now={now} title={copy.todo.setDate} onBack={() => show("menu")} />
      <WhenPicker
        now={now}
        choices={["tomorrow", "friday", "nextWeek", "inAMonth"]}
        value={todo.due && todo.due !== "someday" && todo.due >= now ? todo.due : undefined}
        onPick={(when) => finish({ kind: "move", when })}
      />
    </>
  );
}
