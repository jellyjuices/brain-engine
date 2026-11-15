import clsx from "clsx";
import { addAfter, addHead, addTarget } from "./add.styles.ts";
import { NoteIcon } from "@phosphor-icons/react";
import { Button } from "@ds/components/button/button.tsx";
import { Chip } from "@/components/chip/chip.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { copy } from "@/content/index.ts";

export interface Target {
  path: string;
  title: string;
}

export function AddHead({
  after,
  saving,
  into,
  onDone,
  onClearInto,
}: {
  after: string | null;
  saving: boolean;
  into: Target | null;
  onDone: () => void;
  onClearInto: () => void;
}) {
  return (
    <header className={addHead}>
      <ScreenHead
        title={after ? copy.add.nextTitle : copy.nav.add}
        fallback="/new"
        action={
          after ? (
            <Button variant="outlined" disabled={saving} onClick={onDone}>
              {copy.common.done}
            </Button>
          ) : undefined
        }
      />
      {after && <p className={clsx(addAfter, "lede")}>{copy.add.afterTodo(after)}</p>}
      {into && (
        <div className={addTarget}>
          <span className="lede">{copy.add.addingTo}</span>
          <Chip
            icon={NoteIcon}
            label={copy.common.remove(into.title || copy.add.thisNote)}
            onRemove={onClearInto}
          >
            {into.title || copy.add.thisNote}
          </Chip>
        </div>
      )}
    </header>
  );
}
