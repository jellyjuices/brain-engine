import "./add-panel.css";
import {
  BookOpenIcon,
  CheckIcon,
  CheckSquareIcon,
  DotsThreeIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Shape } from "@/components/shape/shape.tsx";
import { saveJournal } from "@/flows/new-flow.ts";
import { saveFlow } from "@/flows/save-flow.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { queueInbox } from "@/lib/sync/writes.ts";
import { copy } from "@/content/index.ts";

type Mode = "closed" | "open" | "todo" | "journal";

export function AddPanel() {
  const [mode, setMode] = useState<Mode>("closed");
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const editing = mode === "todo" || mode === "journal";

  useEffect(() => {
    if (editing) requestAnimationFrame(() => box.current?.focus());
  }, [editing]);

  useEffect(() => {
    if (mode === "closed") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
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
    box.current?.blur();
    setClosing(true);
  }

  function closed() {
    setClosing(false);
    setMode("closed");
  }

  function main() {
    if (busy) return;
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
    <div className={clsx("add-panel", `is-${mode}`, closing && "is-closing")}>
      {mode !== "closed" && (
        <button
          type="button"
          className="add-scrim"
          aria-label={copy.common.close}
          onClick={() => close()}
        />
      )}
      {mode !== "closed" && (
        <div
          className={clsx("add-blob", `add-blob--${mode}`)}
          onAnimationEnd={(e) => {
            if (e.animationName === "add-deflate") closed();
          }}
        >
          {mode === "open" && (
            <div className="add-arc" role="menu" aria-label={copy.add.newTitle}>
              <button
                type="button"
                role="menuitem"
                className="add-pick add-pick--1"
                onClick={() => setMode("todo")}
              >
                <Shape name="todo" icon={CheckSquareIcon} size="lg" />
                <span>{copy.add.todo}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="add-pick add-pick--2"
                onClick={() => setMode("journal")}
              >
                <Shape name="journal" icon={BookOpenIcon} size="lg" />
                <span>{copy.add.journal}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="add-pick add-pick--3"
                onClick={other}
              >
                <Shape name="other" icon={DotsThreeIcon} size="lg" />
                <span>{copy.add.other}</span>
              </button>
            </div>
          )}
          {editing && (
            <div
              ref={box}
              className="add-box"
              role="textbox"
              tabIndex={0}
              aria-multiline="true"
              aria-label={mode === "todo" ? copy.add.todo : copy.add.journal}
              data-placeholder={mode === "todo" ? copy.add.todoHint : copy.add.writePlaceholder}
              contentEditable="plaintext-only"
              suppressContentEditableWarning
              onKeyDown={(e) => {
                if (mode === "todo" && e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void save();
                }
              }}
            />
          )}
        </div>
      )}
      <button
        type="button"
        className="add-main"
        aria-label={label}
        aria-expanded={mode !== "closed"}
        aria-busy={busy || undefined}
        onClick={main}
      >
        <Shape
          name={mode === "closed" ? "add" : "other"}
          icon={editing ? CheckIcon : PlusIcon}
          size="lg"
          variant={mode === "closed" ? "primary" : "secondary"}
        />
        <span className="label">{copy.nav.add}</span>
      </button>
    </div>
  );
}
