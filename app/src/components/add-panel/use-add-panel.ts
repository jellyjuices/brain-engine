import { useEffect, useRef, useState } from "react";
import type { EditorSaved } from "./add-editor.tsx";
import { useHoldToPick } from "./use-hold-to-pick.ts";
import { onAddRequest, takeAddRequest, type AddRequest } from "./add-request.ts";
import { useBackLayer } from "@/hooks/use-back-layer.ts";
import { keepCaretInView } from "@/lib/platform/caret.ts";
import { pickSubject, saveJournal, saveNote } from "@/flows/create-flow.ts";
import { addTodo } from "@/flows/add-flow.ts";
import { todayIso, type StoredNote } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";

export type Mode = "closed" | "open" | "todo" | "journal" | "note";

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
  const [about, setAbout] = useState<StoredNote | null>(null);
  const picking = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const reader = useRef<(() => EditorSaved) | null>(null);
  const editing = mode === "todo" || mode === "journal" || mode === "note";
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

  function write({ text, tags, date, home }: EditorSaved) {
    if (mode === "todo") return addTodo({ text, tags, into: target?.into, home });
    if (mode === "note" && about) return saveNote(text, about, date ?? todayIso());
    return saveJournal({ title: "", text, date: date ?? todayIso() });
  }

  async function save() {
    const saved = reader.current?.();
    if (!saved?.text) return close();
    setBusy(true);
    try {
      if (await write(saved)) close();
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!busy) void save();
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
    setAbout(null);
    setMode("closed");
  }

  async function note() {
    if (picking.current) return;
    picking.current = true;
    try {
      const picked = await pickSubject();
      if (!picked) return;
      setAbout(picked);
      setMode((current) => (current === "open" ? "note" : current));
    } finally {
      picking.current = false;
    }
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
    about,
    box,
    reader,
    editing,
    hold,
    close,
    closed,
    toggleFull,
    submit,
    note,
    main,
    other,
  };
}
