import { useCallback, useEffect, useRef, useState } from "react";
import { useNotes } from "@/hooks/use-notes.ts";
import { useOutboxCount } from "@/hooks/use-outbox-count.ts";
import { todayIso, type StoredNote } from "@/lib/notes/model.ts";
import {
  fromTodosResponse,
  localView,
  type TodoViewId,
  type ViewTodo,
} from "@/lib/notes/todo-views.ts";
import { api } from "@/lib/sync/api.ts";
import { syncNow } from "@/lib/sync/sync.ts";

interface Remote {
  view: TodoViewId;
  date: string;
  basis: StoredNote[] | null;
  items: ViewTodo[];
}

export interface TodoViewState {
  now: string;
  items: ViewTodo[] | null;
  noDate: number;
  refresh: () => Promise<void>;
}

export function useTodoView(view: TodoViewId): TodoViewState {
  const now = todayIso();
  const notes = useNotes();
  const pending = useOutboxCount();
  const latest = useRef(notes);
  const [remote, setRemote] = useState<Remote | null>(null);

  useEffect(() => {
    latest.current = notes;
  }, [notes]);

  const refresh = useCallback(async () => {
    await syncNow();
    const res = await api(`/api/todos?view=${view}`);
    const data = res.ok ? fromTodosResponse(res.data) : null;
    setRemote(data && { view, ...data, basis: latest.current });
  }, [view]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!notes) return { now, items: null, noDate: 0, refresh };
  const fresh =
    remote?.view === view && remote.date === now && remote.basis === notes && pending === 0;
  return {
    now,
    items: fresh ? remote.items : localView(notes, view, now),
    noDate: view === "today" ? localView(notes, "no-date", now).length : 0,
    refresh,
  };
}
