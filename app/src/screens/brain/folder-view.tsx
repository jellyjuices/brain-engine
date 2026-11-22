import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useNotesState } from "@/hooks/use-notes-state.ts";
import { NotesEmptyState } from "@/components/empty-state/notes-empty-state.tsx";
import { folderRows } from "@/lib/notes/folders.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";
import { folderLook } from "@/lib/notes/kinds.ts";
import { ADD_IN, type Folder } from "./folders.ts";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { OpenCountChip } from "./open-count-chip.tsx";

export function FolderView({ folder }: { folder: Folder }) {
  const { notes, state, retry } = useNotesState();
  const rows = notes ? folderRows(notes, folder) : [];
  const add = ADD_IN[folder];
  const addLabel = copy.notes.addIn[folder as keyof typeof copy.notes.addIn];
  return (
    <>
      <PageHeader
        title={copy.notes.folders[folder]}
        fallback="/brain"
        action={
          add && (
            <Button variant="outlined" icon={PlusIcon} onClick={() => void add()}>
              {addLabel}
            </Button>
          )
        }
      />
      {state !== "ready" ? (
        <NotesEmptyState state={state} onRetry={retry} />
      ) : !rows.length ? (
        <EmptyState title={copy.notes.emptyFolder} />
      ) : (
        <List>
          {rows.map((n) => (
            <ListRow
              key={n.path}
              {...folderLook(folder)}
              href={noteHref(n.path)}
              title={n.title}
              sub={n.description}
              end={<OpenCountChip open={n.open} />}
              chevron
            />
          ))}
        </List>
      )}
    </>
  );
}
