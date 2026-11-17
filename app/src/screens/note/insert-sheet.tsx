import { typeIcon } from "@/components/icon/icons.ts";
import { Calendar } from "@/components/calendar/calendar.tsx";
import { SearchList } from "@/components/search-list/search-list.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { dateText, referenceText, type Insertion } from "@/lib/notes/insert.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { allNotes } from "@/lib/storage/store.ts";
import { copy } from "@/content/index.ts";

export async function pickReference(from: string): Promise<Insertion | null> {
  const notes = (await allNotes())
    .filter((n) => n.path !== from)
    .sort((x, y) => x.title.localeCompare(y.title));
  return openSheet<Insertion>(copy.notes.insertReference, (finish) => (
    <>
      <SheetHead title={copy.notes.insertReference} />
      <SearchList
        placeholder={copy.add.searchNotes}
        limit={8}
        items={notes.map((n) => ({
          key: n.path,
          value: n,
          match: n.title,
          row: { icon: typeIcon(n.type), title: n.title, sub: n.type },
        }))}
        onPick={(n) => finish(referenceText(from, n))}
      />
    </>
  ));
}

export function pickDate(): Promise<Insertion | null> {
  const now = todayIso();
  return openSheet<Insertion>(copy.notes.insertDate, (finish) => (
    <>
      <SheetHead title={copy.notes.insertDate} />
      <Calendar today={now} value={now} onPick={(iso) => finish(dateText(iso))} />
    </>
  ));
}
