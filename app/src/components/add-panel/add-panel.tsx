import styles from "./add-panel.module.css";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Shape } from "@/components/shape/shape.tsx";
import { AddArc } from "@/components/add-arc/add-arc.tsx";
import { AddBox } from "@/components/add-box/add-box.tsx";
import { AddFull } from "./add-full.tsx";
import { useHoldToPick } from "./use-hold-to-pick.ts";
import { useBackLayer } from "@/hooks/use-back-layer.ts";
import { keepCaretInView } from "@/lib/platform/caret.ts";
import { saveJournal } from "@/flows/new-flow.ts";
import { saveFlow } from "@/flows/save-flow.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { queueInbox } from "@/lib/sync/writes.ts";
import { copy } from "@/content/index.ts";

type Mode = "closed" | "open" | "todo" | "journal";

export function AddPanel({ layout = "tab" }: { layout?: "tab" | "rail" }) {
  const [mode, setMode] = useState<Mode>("closed");
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const editing = mode === "todo" || mode === "journal";
  const releaseBack = useBackLayer(mode !== "closed" && !closing, () => close());
  const hold = useHoldToPick(
    mode === "closed" && !busy,
    () => setMode("open"),
    () => close(),
  );

  useEffect(() => {
    if (editing) requestAnimationFrame(() => box.current?.focus());
  }, [editing]);

  const latestClose = useRef(close);
  useEffect(() => {
    latestClose.current = close;
  });

  useEffect(() => {
    if (mode === "closed") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") latestClose.current();
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [mode]);

  async function save() {
    const text = box.current?.innerText.trim() ?? "";
    if (!text) {
      close();
      return;
    }
    setBusy(true);
    try {
      const ok =
        mode === "todo"
          ? await saveFlow(() => queueInbox(text), copy.save.saved)
          : await saveJournal({ title: "", text, date: todayIso() });
      if (ok) close();
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (mode === "closed") return;
    releaseBack();
    box.current?.blur();
    setClosing(true);
  }

  function toggleFull() {
    setFull(!full);
    const area = box.current;
    area?.addEventListener("transitionend", () => keepCaretInView(area), { once: true });
  }

  function closed() {
    setClosing(false);
    setFull(false);
    setMode("closed");
  }

  function main() {
    if (busy || hold.takeClick()) return;
    if (editing) void save();
    else if (mode === "open") close();
    else setMode("open");
  }

  function other() {
    close();
    go("/new");
  }

  const label = editing ? copy.common.save : mode === "open" ? copy.common.close : copy.nav.add;

  return (
    <div
      className={clsx(
        styles.addPanel,
        layout === "rail" && styles.rail,
        mode === "closed" && styles.isClosed,
        mode === "open" && styles.isOpen,
        closing && styles.isClosing,
      )}
      data-mode={mode}
    >
      {mode !== "closed" && (
        <button
          type="button"
          className={styles.addScrim}
          aria-label={copy.common.close}
          onClick={() => close()}
        />
      )}
      {mode !== "closed" && (
        <div
          className={clsx(
            styles.addBlob,
            mode === "todo" && styles.addBlobTodo,
            mode === "journal" && styles.addBlobJournal,
            full && styles.isFull,
          )}
          onAnimationEnd={(e) => {
            if (e.animationName === styles["add-deflate"]) closed();
          }}
        >
          {mode === "open" && (
            <AddArc
              onTodo={() => setMode("todo")}
              onJournal={() => setMode("journal")}
              onOther={other}
            />
          )}
          {editing && <AddBox ref={box} kind={mode} full={full} />}
        </div>
      )}
      {mode === "journal" && !closing && <AddFull full={full} onToggle={toggleFull} />}
      <button
        type="button"
        className={styles.addMain}
        aria-label={label}
        aria-expanded={mode !== "closed"}
        aria-busy={busy || undefined}
        onClick={main}
        onPointerDown={hold.onPointerDown}
        onContextMenu={hold.onContextMenu}
      >
        <Shape
          name={mode === "closed" ? "add" : "other"}
          icon={editing ? CheckIcon : PlusIcon}
          size="lg"
          variant={mode === "closed" ? "primary" : "secondary"}
        />
        <span className={styles.label}>{copy.nav.add}</span>
      </button>
    </div>
  );
}
