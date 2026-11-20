import { useEffect, useRef, useState } from "react";
import type { EditorSaved } from "./add-editor.tsx";
import { useHoldToPick } from "./use-hold-to-pick.ts";
import { onAddRequest, takeAddRequest, type AddRequest } from "./add-request.ts";
import { useBackLayer } from "@/hooks/use-back-layer.ts";
import { keepCaretInView } from "@/lib/platform/caret.ts";
import { saveJournal } from "@/flows/create-flow.ts";
import { addTodo } from "@/flows/add-flow.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";

export type Mode = "closed" | "open" | "todo" | "journal";

function useAddRequests(onRequest: (request: AddRequest) => void) {
  const latest = useRef(onRequest);
  useEffect(() => {
    latest.current = onRequest;
  });
  useEffect(() => {
    function open() {
      const request = takeAddRequest();
      if (request) latest.current(request);
    }
    open();
    return onAddRequest(open);
  }, []);
}

function useEscape(active: boolean, onEscape: () => void) {
  const latest = useRef(onEscape);
  useEffect(() => {
    latest.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) latest.current();
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [active]);
}

export function useAddPanel() {
  const [mode, setMode] = useState<Mode>("closed");
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [full, setFull] = useState(false);
  const [target, setTarget] = useState<AddRequest | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const reader = useRef<(() => EditorSaved) | null>(null);
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

  useAddRequests((request) => {
    setTarget(request);
    setClosing(false);
    setMode("todo");
  });

  useEscape(mode !== "closed", () => close());

  function write(text: string, tags: string[], home: EditorSaved["home"]) {
    return mode === "todo"
      ? addTodo({ text, tags, into: target?.into, home })
      : saveJournal({ title: "", text, date: todayIso() });
  }

  async function save() {
    const { text, tags, home } = reader.current?.() ?? { text: "", tags: [], home: null };
    if (!text) return close();
    setBusy(true);
    try {
      if (await write(text, tags, home)) close();
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
    setTarget(null);
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
    go("/add");
  }

  return {
    mode,
    setMode,
    busy,
    closing,
    full,
    target,
    box,
    reader,
    editing,
    hold,
    close,
    closed,
    toggleFull,
    main,
    other,
  };
}
