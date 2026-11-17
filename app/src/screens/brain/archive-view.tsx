import { Empty } from "@/components/empty/empty.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { archiveRows } from "@/lib/notes/folders.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export function ArchiveView() {
  const notes = useNotes();
  const rows = notes ? archiveRows(notes) : [];
  return (
    <>
      <PageHeader title={copy.notes.archive} fallback="/brain" />
      {notes && !rows.length ? (
        <Empty title={copy.notes.emptyFolder} />
      ) : (
        <List>
          {rows.map((n) => (
            <Row key={n.path} href={noteHref(n.path)} title={n.title} sub={n.description} chevron />
          ))}
        </List>
      )}
    </>
  );
}
