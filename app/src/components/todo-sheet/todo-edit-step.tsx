import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export function TodoEditStep({
  todo,
  now,
  finish,
  show,
  back,
}: TodoStepProps & { back: "menu" | "doneMenu" }) {
  const [words, setWords] = useState(todo.text);
  const ready = words.trim() !== "" && words.trim() !== todo.text;

  function save() {
    if (ready) finish({ kind: "edit", text: words.trim() });
  }

  return (
    <>
      <TodoSheetHeader
        todo={todo}
        now={now}
        title={copy.todo.editTitle}
        onBack={() => show(back)}
      />
      <TextField
        label={copy.todo.words}
        autoFocus
        enterKeyHint="done"
        value={words}
        onChange={setWords}
        onEnter={save}
      />
      <SheetActions>
        <Button variant="primary" disabled={!ready} onClick={save}>
          {copy.common.save}
        </Button>
      </SheetActions>
    </>
  );
}
