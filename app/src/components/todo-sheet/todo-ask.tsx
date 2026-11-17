import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export interface TodoAskProps extends TodoStepProps {
  step: "done" | "drop";
}

export function TodoAsk({ todo, now, finish, show, step }: TodoAskProps) {
  const [said, setSaid] = useState("");
  const done = step === "done";

  function save() {
    finish(done ? { kind: "done", happened: said } : { kind: "drop", why: said });
  }

  return (
    <>
      <TodoSheetHead
        todo={todo}
        now={now}
        title={done ? copy.todo.markDoneTitle : copy.todo.archiveTitle}
        onBack={() => show("menu")}
      />
      <TextField
        label={done ? copy.todo.whatHappened : copy.todo.why}
        placeholder={done ? copy.todo.whatHappenedExample : copy.todo.whyExample}
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
