import { useEffect } from "react";
import { ArchiveIcon, ArrowElbowDownRightIcon } from "@phosphor-icons/react";
import { archiveInboxItem, openInboxItem } from "@/flows/inbox-flow.ts";
import { Swipe } from "@/components/swipe/swipe.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { SyncLine } from "@/components/sync-line/sync-line.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { useOutboxItems } from "@/hooks/use-outbox-items.ts";
import { inboxItems, inboxText } from "@/lib/notes/capture.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { pendingText } from "@/lib/sync/pending-text.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { Empty } from "@/components/empty/empty.tsx";
import { copy } from "@/content/index.ts";

export function InboxScreen() {
  const notes = useNotes();
  useEffect(() => {
    void syncNow({ full: true });
  }, []);
  const items = notes ? inboxItems(notes) : [];
  const sending = useOutboxItems().filter((item) => item.kind === "inbox");
  return (
    <>
      <ScreenHead title={copy.nav.inbox} onBack={() => back()} />
      <SyncLine />
      {notes && !items.length && !sending.length ? (
        <Empty title={copy.inbox.empty} />
      ) : (
        <List>
          {sending.map((item) => (
            <Row key={item.id} title={pendingText(item)} busy />
          ))}
          {items.map((n) => (
            <Swipe
              key={n.path}
              right={{
                label: copy.inbox.sort,
                icon: ArrowElbowDownRightIcon,
                onSwipe: () => openInboxItem(n, "about"),
              }}
              left={{
                label: copy.inbox.archive,
                icon: ArchiveIcon,
                away: true,
                onSwipe: (collapse) => archiveInboxItem(n, collapse),
              }}
              onTap={() => void openInboxItem(n)}
            >
              <Row href={noteHref(n.path)} title={inboxText(n)} />
            </Swipe>
          ))}
        </List>
      )}
    </>
  );
}
