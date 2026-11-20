import { ArchiveIcon, ArrowElbowDownRightIcon, InfoIcon, SparkleIcon } from "@phosphor-icons/react";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import type { StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export type SortChoice = "guess" | "else" | "open" | "archive";

export function sortSheet(text: string, guess: StoredNote | undefined): Promise<SortChoice | null> {
  return openSheet<SortChoice>(text, (finish) => (
    <>
      <SheetHead
        title={text}
        context={
          guess && (
            <>
              <SparkleIcon aria-hidden /> {copy.sort.suggested}
            </>
          )
        }
      />
      <MenuGroups
        groups={[
          [
            {
              id: "guess",
              icon: ArrowElbowDownRightIcon,
              title: guess ? copy.sort.sortTo(guess.title) : copy.sort.pickSubject,
              variant: "primary",
              chevron: !guess,
              onClick: () => finish(guess ? "guess" : "else"),
            },
            !!guess && {
              id: "else",
              icon: ArrowElbowDownRightIcon,
              title: copy.sort.somewhereElse,
              chevron: true,
              onClick: () => finish("else"),
            },
          ],
          [
            {
              id: "open",
              icon: InfoIcon,
              title: copy.inbox.getDetails,
              chevron: true,
              onClick: () => finish("open"),
            },
          ],
          [
            {
              id: "archive",
              icon: ArchiveIcon,
              title: copy.inbox.archive,
              variant: "danger",
              onClick: () => finish("archive"),
            },
          ],
        ]}
      />
    </>
  ));
}
