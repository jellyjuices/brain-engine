import { Button } from "@ds/components/button/button.tsx";
import { typeIcon } from "@/components/icon/icons.ts";
import { SearchList } from "@/components/search-list/search-list.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { isFiled } from "@/lib/notes/capture.ts";
import { SUBJECT_TYPES } from "@/lib/notes/types.ts";
import { InboxHead } from "./inbox-head.tsx";
import type { InboxStepProps } from "./inbox-sheet.tsx";
import { copy } from "@/content/index.ts";

export interface InboxAboutProps extends InboxStepProps {
  onPick: (path: string) => void;
}

export function InboxAbout({ item, show, onPick }: InboxAboutProps) {
  const notes = useNotes() ?? [];
  const items = notes
    .filter((n) => isFiled(n) && SUBJECT_TYPES.includes(n.type ?? ""))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((n) => ({
      key: n.path,
      value: n.path,
      match: n.title,
      row: { icon: typeIcon(n.type), title: n.title, sub: n.type ?? copy.common.note },
    }));
  return (
    <>
      <InboxHead item={item} title={copy.inbox.aboutWhat} onBack={() => show("menu")} />
      <SearchList
        placeholder={copy.inbox.aboutPlaceholder}
        items={items}
        limit={8}
        chevron
        onPick={onPick}
      />
      <Button variant="outlined" block onClick={() => onPick("")}>
        {copy.inbox.skipAbout}
      </Button>
    </>
  );
}
