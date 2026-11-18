import { NoteIcon } from "@phosphor-icons/react";
import styles from "./add-head.module.css";
import { Button } from "@/components/button/button.tsx";
import { Chip } from "@/components/chip/chip.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
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
    <header className={styles.addHead}>
      <PageHeader
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
      {after && <p className={styles.addAfter}>{copy.add.afterTodo(after)}</p>}
      {into && (
        <div className={styles.addTarget}>
          <span className={styles.addingTo}>{copy.add.addingTo}</span>
          <Chip
            icon={NoteIcon}
            variant="accent"
            label={into.title || copy.add.thisNote}
            removeLabel={copy.common.remove(into.title || copy.add.thisNote)}
            onRemove={onClearInto}
          />
        </div>
      )}
    </header>
  );
}
