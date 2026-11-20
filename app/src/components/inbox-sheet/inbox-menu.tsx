import { ArchiveIcon, ArrowElbowDownRightIcon, InfoIcon } from "@phosphor-icons/react";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import { InboxSheetHeader } from "./inbox-sheet-header.tsx";
import type { InboxStepProps } from "./inbox-sheet.tsx";
import { copy } from "@/content/index.ts";

export function InboxMenu({ item, finish, show }: InboxStepProps) {
  return (
    <>
      <InboxSheetHeader item={item} />
      <MenuGroups
        groups={[
          [
            {
              id: "sort",
              icon: ArrowElbowDownRightIcon,
              title: copy.inbox.sort,
              variant: "primary",
              chevron: true,
              onClick: () => show("about"),
            },
          ],
          [
            {
              id: "open",
              icon: InfoIcon,
              title: copy.inbox.getDetails,
              chevron: true,
              onClick: () => finish({ kind: "open" }),
            },
          ],
          [
            {
              id: "archive",
              icon: ArchiveIcon,
              title: copy.inbox.archive,
              variant: "danger",
              onClick: () => finish({ kind: "archive" }),
            },
          ],
        ]}
      />
    </>
  );
}
