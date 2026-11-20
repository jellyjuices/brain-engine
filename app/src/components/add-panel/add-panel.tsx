import styles from "./add-panel.module.css";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import clsx from "clsx";
import { KindIcon } from "@/components/kind-icon/kind-icon.tsx";
import { AddSurface } from "./add-surface.tsx";
import { useAddPanel, type Mode } from "./use-add-panel.ts";
import { copy } from "@/content/index.ts";

function mainLabel(mode: Mode, editing: boolean) {
  if (editing) return copy.common.save;
  return mode === "open" ? copy.common.close : copy.nav.add;
}

export function AddPanel({ layout = "tab" }: { layout?: "tab" | "rail" }) {
  const panel = useAddPanel();
  const { mode, busy, closing, editing, hold } = panel;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const isClosed = mode === "closed";

  return (
    <div
      ref={setHost}
      className={clsx(
        styles.addPanel,
        layout === "rail" && styles.rail,
        isClosed && styles.isClosed,
        mode === "open" && styles.isOpen,
        closing && styles.isClosing,
      )}
      data-mode={mode}
    >
      {!isClosed && (
        <button
          type="button"
          className={styles.addScrim}
          aria-label={copy.common.close}
          onClick={() => panel.close()}
        />
      )}
      {!isClosed && <AddSurface panel={panel} host={host} />}
      <button
        type="button"
        className={styles.addMain}
        aria-label={mainLabel(mode, editing)}
        aria-expanded={!isClosed}
        aria-busy={busy || undefined}
        onClick={panel.main}
        onPointerDown={hold.onPointerDown}
        onContextMenu={hold.onContextMenu}
      >
        <KindIcon
          name={isClosed ? "add" : "other"}
          icon={editing ? CheckIcon : PlusIcon}
          size="lg"
          variant={isClosed ? "primary" : "secondary"}
        />
        <span className={styles.label}>{copy.nav.add}</span>
      </button>
    </div>
  );
}
