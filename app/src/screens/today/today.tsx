import styles from "./today.module.css";
import { TrayIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { IconButton } from "@/components/icon-button/icon-button.tsx";
import { PullToRefresh } from "@/components/pull-to-refresh/pull-to-refresh.tsx";
import { SyncStatus } from "@/components/sync-status/sync-status.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { useOutboxCount } from "@/hooks/use-outbox-count.ts";
import { inboxItems } from "@/lib/notes/capture.ts";
import { navigate } from "@/lib/platform/router.ts";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { computeToday, fromServer, type TodayItem } from "@/lib/notes/today.ts";
import { api } from "@/lib/sync/api.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { TodayList } from "./today-list.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { copy } from "@/content/index.ts";

type Remote = { date: string; items: TodayItem[] } | null;

export function TodayScreen() {
  const now = todayIso();
  const notes = useNotes();
  const pending = useOutboxCount();
  const [remote, setRemote] = useState<Remote>(null);

  const refresh = useCallback(async () => {
    await syncNow();
    const res = await api("/api/today");
    setRemote(res.ok ? fromServer(res.data) : null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setRemote(null);
  }, [notes]);

  if (!notes) return null;
  const local = computeToday(notes, now);
  const data =
    remote && pending === 0 && remote.date === now
      ? { ...remote, doneToday: local.doneToday }
      : local;

  const inbox = inboxItems(notes).length;

  return (
    <>
      <PullToRefresh onRefresh={refresh} />
      <PageHeader
        title={longDate(now)}
        action={
          <span className={styles.inboxBtn}>
            <IconButton
              icon={TrayIcon}
              label={inbox ? copy.nav.inboxCount(inbox) : copy.nav.inbox}
              onClick={() => navigate("inbox")}
            />
            {inbox > 0 && (
              <span className={styles.inboxBadge} aria-hidden="true">
                {inbox > 99 ? "99+" : inbox}
              </span>
            )}
          </span>
        }
      />
      <SyncStatus />
      <div>
        {notes.length || data.items.length ? (
          <TodayList data={data} />
        ) : (
          <EmptyState title={copy.today.noNotesTitle} body={copy.today.noNotesBody} />
        )}
      </div>
    </>
  );
}
