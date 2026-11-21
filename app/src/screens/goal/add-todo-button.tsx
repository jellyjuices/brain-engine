import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { goalTodosHref } from "@/lib/notes/goals.ts";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export function AddTodoButton({ path }: { path: string }) {
  return (
    <Button variant="outlined" icon={PlusIcon} onClick={() => go(goalTodosHref(path))}>
      {copy.goals.addTodo}
    </Button>
  );
}
