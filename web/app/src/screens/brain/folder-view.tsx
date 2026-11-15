import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@ds/components/button/button.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { folderRows } from "@/lib/notes/folders.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";
import { ADD_IN, type Folder } from "./folders.ts";
import { Empty } from "@/components/empty/empty.tsx";
import { OpenChip } from "./open-chip.tsx";

export function FolderView({ folder }: { folder: Folder }) {
  const notes = useNotes();
  const rows = notes ? folderRows(notes, folder) : [];
  const add = ADD_IN[folder];
  const addLabel = copy.notes.addIn[folder as keyof typeof copy.notes.addIn];
  return (
    <>
      <ScreenHead
        title={copy.notes.folders[folder]}
        fallback="/brain"
        action={
          add && (
            <Button variant="outlined" icon={<PlusIcon aria-hidden />} onClick={() => void add()}>
              {addLabel}
            </Button>
          )
        }
      />
      {notes && !rows.length ? (
        <Empty title={copy.notes.emptyFolder} />
      ) : (
        <List>
          {rows.map((n) => (
            <Row
              key={n.path}
              href={noteHref(n.path)}
              title={n.title}
              sub={n.description}
              end={<OpenChip open={n.open} />}
              chevron
            />
          ))}
        </List>
      )}
    </>
  );
}
