import { ArchiveIcon, CalendarCheckIcon, CalendarDotsIcon } from "@phosphor-icons/react";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { SyncStatus } from "@/components/sync-status/sync-status.tsx";
import { useNotesState } from "@/hooks/use-notes-state.ts";
import { NotesEmptyState } from "@/components/empty-state/notes-empty-state.tsx";
import { folderSummaries } from "@/lib/notes/folders.ts";
import { copy } from "@/content/index.ts";
import { folderLook } from "@/lib/notes/kinds.ts";
import { FOLDERS, type Folder } from "./folders.ts";
import { OpenCountChip } from "./open-count-chip.tsx";

export function FolderList() {
  const { notes, state, retry } = useNotesState();
  const rows = notes ? folderSummaries(notes, FOLDERS) : [];
  return (
    <>
      <PageHeader title={copy.nav.brain} />
      <SyncStatus />
      {state !== "ready" && <NotesEmptyState state={state} onRetry={retry} />}
      <List>
        {rows.map((f) => (
          <ListRow
            key={f.folder}
            href={`/brain/${f.folder}`}
            {...folderLook(f.folder)}
            title={copy.notes.folders[f.folder as Folder]}
            sub={f.count === 1 ? copy.common.oneNote : copy.common.noteCount(f.count)}
            end={<OpenCountChip open={f.open} />}
            chevron
          />
        ))}
      </List>
      <SectionHeader title={copy.report.title} />
      <List>
        <ListRow
          href="/report/today"
          icon={CalendarCheckIcon}
          title={copy.report.today}
          sub={copy.report.todayHint}
          chevron
        />
        <ListRow
          href="/report/weekly"
          icon={CalendarDotsIcon}
          title={copy.report.weekly}
          sub={copy.report.weeklyHint}
          chevron
        />
      </List>
      <List>
        <ListRow
          href="/brain/archive"
          icon={ArchiveIcon}
          title={copy.notes.archive}
          sub={copy.notes.archiveHint}
          chevron
        />
      </List>
    </>
  );
}
