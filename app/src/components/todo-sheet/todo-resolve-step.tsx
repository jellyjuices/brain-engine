import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export interface TodoResolveStepProps extends TodoStepProps {
  step: "done" | "drop";
}

export function TodoResolveStep({ todo, now, finish, show, step }: TodoResolveStepProps) {
  const [said, setSaid] = useState("");
  const done = step === "done";

  function save() {
    finish(done ? { kind: "done", happened: said } : { kind: "drop", why: said });
  }

  return (
    <>
      <TodoSheetHeader
        todo={todo}
        now={now}
        title={done ? copy.todo.markDoneTitle : copy.todo.archiveTitle}
        onBack={() => show("menu")}
      />
      <TextField
        label={done ? copy.todo.whatHappened : copy.todo.why}
        placeholder={done ? copy.todo.whatHappenedPlaceholder : copy.todo.whyPlaceholder}
        multiline
        autoFocus
        enterKeyHint="done"
        value={said}
        onChange={setSaid}
      />
      <SheetActions>
        {done && (
          <Button
            variant="outlined"
            onClick={() => finish({ kind: "doneThenAdd", happened: said })}
          >
            {copy.todo.markDoneAddMore}
          </Button>
        )}
        <Button variant={done ? "primary" : "danger"} onClick={save}>
          {done ? copy.todo.markDone : copy.todo.archive}
        </Button>
      </SheetActions>
    </>
  );
}
