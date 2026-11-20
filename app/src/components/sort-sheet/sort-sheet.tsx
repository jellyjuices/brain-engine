import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { List } from "@/components/list/list.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import type { StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export type SortChoice = "guess" | "else";

export function sortSheet(text: string, guess: StoredNote | undefined): Promise<SortChoice | null> {
  return openSheet<SortChoice>(text, (finish) => (
    <>
      <SheetHead
        context={
          guess && (
            <>
              <SparkleIcon aria-hidden /> {copy.sort.suggested}
            </>
          )
        }
        title={
          guess
            ? copy.sort.addToKind(guess.title, guess.type ?? copy.common.note)
            : copy.sort.whereGoes
        }
      />
      <List variant="ghost">
        <TodoRow title={text} />
      </List>
      <SheetActions>
        {guess && (
          <Button block onClick={() => finish("guess")}>
            {copy.sort.addTo(guess.title)}
          </Button>
        )}
        <Button block variant={guess ? "outlined" : "primary"} onClick={() => finish("else")}>
          {guess ? copy.sort.somewhereElse : copy.sort.pickSubject}
        </Button>
      </SheetActions>
    </>
  ));
}
