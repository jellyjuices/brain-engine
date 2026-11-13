import {
  ArrowElbowDownRightIcon,
  CalendarBlankIcon,
  HashIcon,
  AtIcon,
} from "@phosphor-icons/react";
import { mentionName } from "@/lib/notes/capture.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { noteSheet, tagSheet } from "@/components/pick-sheet/pick-sheet.tsx";
import { Tool } from "@/components/tool-bar/tool.tsx";
import { whenSheet } from "./when-sheet.tsx";
import { copy } from "@/content/index.ts";

export function AddTools({
  tags,
  onWhenWord,
  onTag,
  onMention,
  onInto,
}: {
  tags: string[];
  onWhenWord: (word: string) => void;
  onTag: (tag: string) => void;
  onMention: (name: string) => void;
  onInto: (target: { path: string; title: string }) => void;
}) {
  return (
    <>
      <Tool
        icon={CalendarBlankIcon}
        label={copy.add.when}
        onClick={async () => {
          const word = await whenSheet(todayIso());
          if (word !== null) onWhenWord(word);
        }}
      />
      <Tool
        icon={HashIcon}
        label={copy.common.tag}
        onClick={async () => {
          const t = await tagSheet(tags);
          if (t) onTag(t);
        }}
      />
      <Tool
        icon={AtIcon}
        label={copy.add.mention}
        onClick={async () => {
          const n = await noteSheet(copy.add.mentionTitle);
          if (n) onMention(mentionName(n));
        }}
      />
      <Tool
        icon={ArrowElbowDownRightIcon}
        label={copy.add.addTo}
        onClick={async () => {
          const n = await noteSheet(copy.add.addToTitle);
          if (n) onInto({ path: n.path, title: n.title });
        }}
      />
    </>
  );
}
