import styles from "./file.module.css";
import { useEffect, useState } from "react";
import { WizardStep } from "@/components/wizard-step/wizard-step.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { saveFile } from "@/flows/create-flow.ts";
import { dropHeldFile, heldFile } from "@/flows/pending-file.ts";
import { FILE_ASKS } from "@/lib/notes/file-results.ts";
import { toggled } from "@/lib/notes/toggled.ts";
import { back, go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export function FileScreen() {
  const [held] = useState(heldFile);
  const [asks, setAsks] = useState<Set<string>>(() => new Set(["split"]));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!held) go("/add", true);
  }, [held]);

  if (!held) return null;

  async function add() {
    if (!held) return;
    setBusy(true);
    await saveFile(
      held,
      FILE_ASKS.filter((a) => asks.has(a)),
    );
    setBusy(false);
  }

  return (
    <WizardStep
      title={copy.sort.file}
      step={1}
      count={2}
      stepLabel={copy.sort.stepOf(1, 2)}
      question={copy.sort.fileHow(held.title)}
      hint={copy.sort.fileHint}
      backLabel={copy.common.back}
      closeLabel={copy.common.close}
      nextLabel={copy.sort.addFile(held.title)}
      nextDisabled={busy}
      onClose={() => {
        dropHeldFile();
        back();
      }}
      onNext={() => void add()}
    >
      <div className={styles.fill}>
        <List variant="ghost">
          {FILE_ASKS.map((id) => {
            const [title, sub] = copy.sort.ways[id];
            return (
              <ListRow
                key={id}
                checked={asks.has(id)}
                title={title}
                sub={sub}
                onClick={() => setAsks(toggled(asks, id))}
              />
            );
          })}
        </List>
        <p className={styles.helper}>{copy.sort.fileKept}</p>
      </div>
    </WizardStep>
  );
}
