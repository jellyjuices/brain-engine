import { ArchiveIcon, CalendarCheckIcon, CalendarDotsIcon } from "@phosphor-icons/react";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { SyncLine } from "@/components/sync-line/sync-line.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { folderSummaries } from "@/lib/notes/folders.ts";
import { copy } from "@/content/index.ts";
import { FOLDER_ICON, FOLDERS, type Folder } from "./folders.ts";
import { OpenChip } from "./open-chip.tsx";

export function FolderList() {
  const notes = useNotes();
  const rows = notes ? folderSummaries(notes, FOLDERS) : [];
  return (
    <>
      <ScreenHead title={copy.nav.brain} />
      <SyncLine />
      <List>
        {rows.map((f) => (
          <Row
            key={f.folder}
            href={`/brain/${f.folder}`}
            icon={FOLDER_ICON[f.folder as Folder]}
            title={copy.notes.folders[f.folder as Folder]}
            sub={f.count === 1 ? copy.common.oneNote : copy.common.noteCount(f.count)}
            end={<OpenChip open={f.open} />}
            chevron
          />
        ))}
      </List>
      <p className="section-label">{copy.report.title}</p>
      <List>
        <Row
          href="/report/today"
          icon={CalendarCheckIcon}
          title={copy.report.today}
          sub={copy.report.todayHint}
          chevron
        />
        <Row
          href="/report/weekly"
          icon={CalendarDotsIcon}
          title={copy.report.weekly}
          sub={copy.report.weeklyHint}
          chevron
        />
      </List>
      <List>
        <Row
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
