import { useEffect } from "react";
import { ArrowElbowDownRightIcon, TrashIcon } from "@phosphor-icons/react";
import styles from "./inbox.module.css";
import { archiveInboxItem, openInboxItem, sortCapture } from "@/flows/inbox-flow.ts";
import { bestHome } from "@/lib/notes/home-guess.ts";
import { SwipeActions } from "@/components/swipe-actions/swipe-actions.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { SyncStatus } from "@/components/sync-status/sync-status.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { useOutboxItems } from "@/hooks/use-outbox-items.ts";
import { inboxItems, inboxText } from "@/lib/notes/capture.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { pendingText } from "@/lib/sync/pending-text.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
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
      <PageHeader title={copy.nav.inbox} onBack={() => back()} />
      <SyncStatus />
      {notes && !items.length && !sending.length ? (
        <EmptyState title={copy.inbox.empty} />
      ) : (
        <List>
          {sending.map((item) => (
            <ListRow key={item.id} title={pendingText(item)} busy />
          ))}
          {items.map((n) => (
            <SwipeActions
              key={n.path}
              right={{
                label: copy.inbox.sort,
                icon: ArrowElbowDownRightIcon,
                onSwipe: () => openInboxItem(n, "about"),
              }}
              left={{
                label: copy.inbox.archive,
                icon: TrashIcon,
                away: true,
                onSwipe: (collapse) => archiveInboxItem(n, collapse),
              }}
              onTap={() => void sortCapture(n, notes ?? [])}
            >
              <ListRow
                href={noteHref(n.path)}
                title={inboxText(n)}
                end={
                  notes &&
                  bestHome(notes, inboxText(n)) && (
                    <span role="img" aria-label={copy.sort.hasGuess} className={styles.guessDot} />
                  )
                }
              />
            </SwipeActions>
          ))}
        </List>
      )}
    </>
  );
}
