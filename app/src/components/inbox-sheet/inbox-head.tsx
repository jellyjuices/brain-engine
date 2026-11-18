import { Chip } from "@/components/chip/chip.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import type { StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export interface InboxHeadProps {
  item: StoredNote;
  title?: string;
  onBack?: () => void;
}

export function InboxHead({ item, title, onBack }: InboxHeadProps) {
  const text = (item.body.trim() || item.title).slice(0, 160);
  return (
    <SheetHead
      title={title ?? text}
      quote={title && text}
      context={<Chip label={copy.inbox.tag} />}
      onBack={onBack}
    />
  );
}
