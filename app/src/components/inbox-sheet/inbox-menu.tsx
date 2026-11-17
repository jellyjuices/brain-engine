import { ArchiveIcon, ArrowElbowDownRightIcon, InfoIcon } from "@phosphor-icons/react";
import { Divider } from "@/components/row/divider.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { InboxHead } from "./inbox-head.tsx";
import type { InboxStepProps } from "./inbox-sheet.tsx";
import { copy } from "@/content/index.ts";

export function InboxMenu({ item, finish, show }: InboxStepProps) {
  return (
    <>
      <InboxHead item={item} />
      <List variant="menu">
        <Row
          icon={ArrowElbowDownRightIcon}
          title={copy.inbox.sort}
          variant="primary"
          chevron
          autoFocus
          onClick={() => show("about")}
        />
        <Divider />
        <Row
          icon={InfoIcon}
          title={copy.inbox.getDetails}
          chevron
          onClick={() => finish({ kind: "open" })}
        />
        <Divider />
        <Row
          icon={ArchiveIcon}
          title={copy.inbox.archive}
          variant="danger"
          onClick={() => finish({ kind: "archive" })}
        />
      </List>
    </>
  );
}
