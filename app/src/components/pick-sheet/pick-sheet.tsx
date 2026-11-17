import { HashIcon } from "@phosphor-icons/react";
import { typeIcon } from "@/components/icon/icons.ts";
import { SearchList, type SearchItem } from "@/components/search-list/search-list.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { isFiled, tagsInUse } from "@/lib/notes/capture.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { allNotes } from "@/lib/storage/store.ts";
import { copy } from "@/content/index.ts";

function pickSheet<T>(title: string, placeholder: string, items: SearchItem<T>[]) {
  return openSheet<T>(title, (finish) => (
    <>
      <SheetHead title={title} />
      <SearchList placeholder={placeholder} items={items} onPick={finish} />
    </>
  ));
}

export async function noteSheet(
  title: string,
  keep: (n: StoredNote) => boolean = () => true,
): Promise<StoredNote | null> {
  const items = (await allNotes())
    .filter((n) => isFiled(n) && keep(n))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((n) => ({
      key: n.path,
      value: n,
      match: n.title,
      row: { icon: typeIcon(n.type), title: n.title, sub: n.type ?? copy.common.note },
    }));
  return pickSheet(title, copy.add.searchNotes, items);
}

export async function tagSheet(taken: string[]): Promise<string | null> {
  const items = tagsInUse(await allNotes())
    .filter((t) => !taken.includes(t))
    .map((t) => ({
      key: t,
      value: t,
      match: t,
      row: { icon: HashIcon, title: `#${t}`, sub: copy.common.tag },
    }));
  return pickSheet(copy.add.addTag, copy.add.searchTags, items);
}
