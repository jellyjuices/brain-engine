import { loopsIn } from "./todos.ts";
import { isArchived, slugOf, type StoredNote } from "./model.ts";

export interface FolderRow {
  path: string;
  title: string;
  description: string;
  type?: string;
  open: number;
}

export interface FolderSummary {
  folder: string;
  count: number;
  open: number;
}

function liveNotes(notes: StoredNote[]) {
  return notes.filter((n) => !n.path.startsWith(".archive/") && n.status !== "deprecated");
}

function openIn(n: StoredNote) {
  return loopsIn(n).filter((l) => !l.done).length;
}

export function folderRows(notes: StoredNote[], folder: string): FolderRow[] {
  const live = liveNotes(notes);
  return live
    .filter(
      (n) => n.path.startsWith(`${folder}/`) && !n.path.slice(folder.length + 1).includes("/"),
    )
    .map((n) => {
      const slug = slugOf(n.path);
      const open =
        folder === "areas"
          ? live
              .filter((m) => m.path === n.path || m.meta.area === slug)
              .reduce((sum, m) => sum + openIn(m), 0)
          : openIn(n);
      return {
        path: n.path,
        title: n.title,
        description: n.description,
        ...(n.type && { type: n.type }),
        open,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function folderSummaries(notes: StoredNote[], folders: readonly string[]): FolderSummary[] {
  const live = liveNotes(notes);
  return folders.map((folder) => {
    const inside = live.filter((n) => n.path.startsWith(`${folder}/`));
    return {
      folder,
      count: inside.length,
      open: inside.reduce((sum, n) => sum + openIn(n), 0),
    };
  });
}

export function archiveRows(notes: StoredNote[]): FolderRow[] {
  return notes
    .filter(isArchived)
    .map((n) => ({
      path: n.path,
      title: n.title,
      description: n.description,
      ...(n.type && { type: n.type }),
      open: 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
