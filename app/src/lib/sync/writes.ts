import { api, type ApiResult } from "./api.ts";
import { recordConflict } from "./conflict.ts";
import type { Decision } from "./local-edit.ts";
import { toStored } from "@/lib/notes/model.ts";
import { enqueue, list, registerHandler, remove } from "./outbox.ts";
import { putNotes } from "@/lib/storage/store.ts";
import { registerRelationWrites } from "./relation-writes.ts";
import { registerGoalWrites } from "./goal-writes.ts";
import type {
  InboxPayload,
  DonePayload,
  MovePayload,
  DropPayload,
  RefPayload,
  TodoTextPayload,
  EditPayload,
  PersonPayload,
  JournalPayload,
  SubjectPayload,
  SortPayload,
  InboxDropPayload,
  FilePayload,
  BirthdayPayload,
  IntakeSavePayload,
  IntakeSkipPayload,
  UndoPayload,
} from "./write-payloads.ts";

export function notePath(path: string) {
  return `/api/notes/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function sendEdit(p: EditPayload): Promise<ApiResult> {
  const res = await api<Record<string, unknown>>(notePath(p.path), {
    method: "PUT",
    body: { body: p.body, base: p.base, tags: p.tags },
  });
  if (res.ok) {
    await putNotes([toStored(res.data)]);
  } else if (!res.offline && res.status === 409 && res.data?.current) {
    await recordConflict({
      path: p.path,
      mine: p.body,
      current: toStored(res.data.current as Record<string, unknown>),
    });
  }
  return res;
}

export function registerWrites() {
  registerRelationWrites();
  registerGoalWrites();
  registerHandler("inbox", (item) => {
    const { text, into, tags } = item.payload as InboxPayload;
    return api("/api/inbox", {
      body: {
        client_id: item.id,
        text,
        created_at: item.created_at,
        ...(into && { into }),
        ...(tags?.length && { tags }),
      },
    });
  });
  registerHandler("done", (item) => api("/api/done", { body: item.payload as DonePayload }));
  registerHandler("move", (item) => api("/api/move", { body: item.payload as MovePayload }));
  registerHandler("drop", (item) => api("/api/drop", { body: item.payload as DropPayload }));
  registerHandler("reopen", (item) => api("/api/reopen", { body: item.payload as RefPayload }));
  registerHandler("skip", (item) => api("/api/skip", { body: item.payload as RefPayload }));
  registerHandler("stop-repeat", (item) =>
    api("/api/stop-repeat", { body: item.payload as RefPayload }),
  );
  registerHandler("edit-todo", (item) =>
    api("/api/edit-todo", { body: item.payload as TodoTextPayload }),
  );
  registerHandler("person", (item) => api("/api/people", { body: item.payload as PersonPayload }));
  registerHandler("journal", (item) =>
    api("/api/journal", { body: item.payload as JournalPayload }),
  );
  registerHandler("subject", (item) =>
    api("/api/subjects", { body: item.payload as SubjectPayload }),
  );
  registerHandler("sort", (item) => api("/api/sort", { body: item.payload as SortPayload }));
  registerHandler("inbox-drop", (item) =>
    api("/api/inbox-drop", { body: item.payload as InboxDropPayload }),
  );
  registerHandler("file", (item) => api("/api/files", { body: item.payload as FilePayload }));
  registerHandler("birthday", (item) =>
    api("/api/birthday", { body: item.payload as BirthdayPayload }),
  );
  registerHandler("intake-save", (item) =>
    api("/api/intake/save", { body: item.payload as IntakeSavePayload }),
  );
  registerHandler("intake-skip", (item) =>
    api("/api/intake/skip", { body: item.payload as IntakeSkipPayload }),
  );
  registerHandler("undo", (item) => api("/api/undo", { body: item.payload as UndoPayload }));
  registerHandler("edit", (item) => sendEdit(item.payload as EditPayload));
}

export function queueInbox(text: string, into?: string, tags: string[] = []) {
  return enqueue<InboxPayload>("inbox", {
    text,
    ...(into && { into }),
    ...(tags.length && { tags }),
  });
}

export async function queueDecision(ref: string, d: Decision): Promise<string> {
  function clean<T extends object>(o: T) {
    return Object.fromEntries(
      Object.entries(o).filter(([, v]) => v !== undefined && v !== ""),
    ) as T;
  }
  if (d.kind === "done")
    return (
      await enqueue<DonePayload>(
        "done",
        clean({ ref, happened: d.happened?.trim(), follow_up: d.follow_up?.trim() }),
      )
    ).id;
  if (d.kind === "move")
    return (
      await enqueue<MovePayload>(
        "move",
        clean({ ref, when: d.when, who: d.who?.trim(), what: d.what?.trim() }),
      )
    ).id;
  if (d.kind === "reopen" || d.kind === "skip")
    return (await enqueue<RefPayload>(d.kind, { ref })).id;
  if (d.kind === "stopRepeat") return (await enqueue<RefPayload>("stop-repeat", { ref })).id;
  if (d.kind === "edit")
    return (await enqueue<TodoTextPayload>("edit-todo", { ref, text: d.text.trim() })).id;
  return (await enqueue<DropPayload>("drop", clean({ ref, why: d.why?.trim() }))).id;
}

export function queuePerson(name: string, birthday?: string) {
  return enqueue<PersonPayload>("person", { name, ...(birthday && { birthday }) });
}

export function queueJournal(p: JournalPayload) {
  return enqueue<JournalPayload>("journal", p);
}

export function queueSubject(type: SubjectPayload["type"], name: string) {
  return enqueue<SubjectPayload>("subject", { type, name });
}

export function queueSort(path: string, into: string, when: string) {
  return enqueue<SortPayload>("sort", { path, into, when });
}

export function queueInboxDrop(path: string) {
  return enqueue<InboxDropPayload>("inbox-drop", { path });
}

export function queueFile(title: string, text: string, asks: string[] = []) {
  return enqueue<FilePayload>("file", { title, text, ...(asks.length && { asks }) });
}

export function queueBirthday(path: string, birthday: string) {
  return enqueue<BirthdayPayload>("birthday", { path, birthday });
}

export function queueIntakeSave(p: IntakeSavePayload) {
  return enqueue<IntakeSavePayload>("intake-save", p);
}

export function queueIntakeSkip(question: string) {
  return enqueue<IntakeSkipPayload>("intake-skip", { question });
}

export function queueUndo(id: string) {
  return enqueue<UndoPayload>("undo", { id });
}

export async function queueEdit(path: string, body: string, base: string, tags?: string[]) {
  const waiting = (await list()).filter(
    (i) => i.kind === "edit" && (i.payload as EditPayload).path === path,
  );
  const oldest = waiting[0] ? (waiting[0].payload as EditPayload).base : base;
  for (const w of waiting) await remove(w.id);
  return enqueue<EditPayload>("edit", { path, body, base: oldest, tags });
}

export async function hasPendingEdit(path: string): Promise<boolean> {
  return (await list()).some((i) => i.kind === "edit" && (i.payload as EditPayload).path === path);
}
