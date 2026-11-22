import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { NoteEdit } from "./note-edit.tsx";
import { NoteLoading } from "./note-loading.tsx";
import { NoteMissing } from "./note-missing.tsx";
import { NoteRead } from "./note-read.tsx";

export function NoteScreen() {
  const { rest: path, params } = useRoute();
  const notes = useNotes();
  const editing = params.has("edit");
  const note = notes?.find((n) => n.path === path);
  const lost = editing && !!notes && !note;

  useEffect(() => {
    if (lost) go(noteHref(path), true);
  }, [lost, path]);

  if (!editing) return <NoteRead path={path} />;
  if (note) return <NoteEdit key={path} note={note} />;
  return notes ? <NoteMissing path={path} /> : <NoteLoading />;
}
