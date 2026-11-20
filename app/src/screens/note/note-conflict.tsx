import styles from "./note.module.css";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { Button } from "@/components/button/button.tsx";
import { toast } from "@/components/toast/toast-store.ts";
import { longDate, type StoredNote } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { keepMacCopy, keepMine, type Conflict } from "@/lib/sync/conflict.ts";
import { flush } from "@/lib/sync/outbox.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { queueEdit } from "@/lib/sync/writes.ts";
import { VersionCopy } from "./version-copy.tsx";
import { copy } from "@/content/index.ts";

export function NoteConflict({ note, conflict }: { note: StoredNote; conflict: Conflict }) {
  async function keep(mine: boolean) {
    if (mine) {
      const send = await keepMine(note.path);
      if (send) await queueEdit(note.path, send.body, send.base);
      void flush().then(() => syncNow());
      toast(copy.toast.keptMine);
    } else {
      await keepMacCopy(note.path);
      toast(copy.toast.keptMac);
    }
  }
  const modified = conflict.current.modified;
  return (
    <>
      <PageHeader title={copy.notes.conflictTitle} kicker={note.type} onBack={() => back()} />
      <p className={styles.lede}>{copy.notes.editConflict}</p>
      <VersionCopy
        label={copy.notes.macVersion}
        text={conflict.current.body}
        sub={modified ? longDate(modified) : undefined}
      />
      <VersionCopy label={copy.notes.yourVersion} text={conflict.mine} />
      <div className={styles.versionButtons}>
        <Button variant="outlined" block onClick={() => void keep(false)}>
          {copy.notes.keepMac}
        </Button>
        <Button block onClick={() => void keep(true)}>
          {copy.notes.keepMine}
        </Button>
      </div>
    </>
  );
}
