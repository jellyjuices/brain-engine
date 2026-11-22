import styles from "./add-panel.module.css";
import clsx from "clsx";
import type { AnimationEvent } from "react";
import { AddMenu } from "@/components/add-menu/add-menu.tsx";
import { AddEditor } from "./add-editor.tsx";
import type { useAddPanel } from "./use-add-panel.ts";

type AddSurfaceProps = {
  panel: ReturnType<typeof useAddPanel>;
  host: HTMLDivElement | null;
};

export function AddSurface({ panel, host }: AddSurfaceProps) {
  const { mode, full, target, closing } = panel;
  const kind = mode === "todo" ? "todo" : mode === "journal" || mode === "note" ? "journal" : null;

  function onAnimationEnd(e: AnimationEvent) {
    if (e.animationName === styles["add-deflate"]) panel.closed();
  }

  return (
    <div
      className={clsx(
        styles.addSurface,
        mode === "todo" && styles.addSurfaceTodo,
        kind === "journal" && styles.addSurfaceJournal,
        full && styles.isFull,
      )}
      onAnimationEnd={onAnimationEnd}
    >
      {mode === "open" && (
        <AddMenu
          onTodo={() => panel.setMode("todo")}
          onJournal={() => panel.setMode("journal")}
          onNote={() => void panel.note()}
          onOther={panel.other}
        />
      )}
      {kind && (
        <AddEditor
          key={`${mode}:${target?.into ?? ""}:${target?.text ?? ""}`}
          initial={target?.text}
          about={mode === "note" ? panel.about?.title : undefined}
          box={panel.box}
          reader={panel.reader}
          kind={kind}
          full={full}
          host={host}
          showBar={!closing}
          onToggleFull={panel.toggleFull}
          onSubmit={panel.submit}
        />
      )}
    </div>
  );
}
