import { addMeta, waitingLink } from "./add.styles.ts";
import {
  CalendarCheckIcon,
  CalendarDotsIcon,
  ClockIcon,
  HourglassIcon,
  MoonStarsIcon,
  NoteIcon,
  HashIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

const CHIP_ICON: Record<string, PhosphorIcon> = {
  inbox: TrayIcon,
  note: NoteIcon,
  today: CalendarCheckIcon,
  date: CalendarDotsIcon,
  someday: MoonStarsIcon,
  waiting: HourglassIcon,
};

export function AddMeta({
  shown,
  tags,
  waiting,
  onRemoveTag,
}: {
  shown: { kind: string; label: string } | null;
  tags: string[];
  waiting: number;
  onRemoveTag: (tag: string) => void;
}) {
  if (!shown && tags.length === 0 && waiting === 0) return null;
  return (
    <div className={addMeta}>
      {shown && (
        <Chip icon={CHIP_ICON[shown.kind] ?? ClockIcon} label={copy.add.whenIs(shown.label)}>
          {shown.label}
        </Chip>
      )}
      {tags.map((t) => (
        <Chip
          key={t}
          icon={HashIcon}
          label={copy.common.remove(`#${t}`)}
          onRemove={() => onRemoveTag(t)}
        >
          {`#${t}`}
        </Chip>
      ))}
      {waiting > 0 && (
        <a
          className={waitingLink}
          href="/settings"
          onClick={(e) => {
            e.preventDefault();
            go("/settings");
          }}
        >
          {copy.add.notSynced(waiting)}
        </a>
      )}
    </div>
  );
}
