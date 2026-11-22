import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useNotesState } from "@/hooks/use-notes-state.ts";
import { NotesEmptyState } from "@/components/empty-state/notes-empty-state.tsx";
import { archiveRows } from "@/lib/notes/folders.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { typeLook } from "@/lib/notes/kinds.ts";
import { copy } from "@/content/index.ts";

export function ArchiveView() {
  const { notes, state, retry } = useNotesState();
  const rows = notes ? archiveRows(notes) : [];
  return (
    <>
      <PageHeader title={copy.notes.archive} fallback="/brain" />
      {state !== "ready" ? (
        <NotesEmptyState state={state} onRetry={retry} />
      ) : !rows.length ? (
        <EmptyState title={copy.notes.emptyFolder} />
      ) : (
        <List>
          {rows.map((n) => (
            <ListRow
              key={n.path}
              {...typeLook(n.type)}
              href={noteHref(n.path)}
              title={n.title}
              sub={n.description}
              chevron
            />
          ))}
        </List>
      )}
    </>
  );
}
