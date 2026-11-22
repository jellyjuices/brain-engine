import styles from "./find.module.css";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { SearchInput } from "@/components/field/search-input.tsx";
import { SyncStatus } from "@/components/sync-status/sync-status.tsx";
import { useNotesState } from "@/hooks/use-notes-state.ts";
import { rememberSearch } from "@/lib/notes/recent-searches.ts";
import { fromServerSearch, type RemoteSearch } from "@/lib/notes/server-search.ts";
import { api } from "@/lib/sync/api.ts";
import { FindOutcome } from "./find-outcome.tsx";
import { RecentChips } from "./recent-chips.tsx";
import { copy } from "@/content/index.ts";

const ASK_DELAY = 250;

export function FindScreen() {
  const { notes, state, retry } = useNotesState();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [remote, setRemote] = useState<RemoteSearch | null>(null);
  const q = value.trim();

  useEffect(() => {
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  useEffect(() => {
    setRemote(null);
  }, [notes]);

  useEffect(() => {
    if (q.length < 2) return;
    let alive = true;
    const timer = setTimeout(() => {
      void api(`/api/card?q=${encodeURIComponent(q)}`).then((res) => {
        if (alive && res.ok) setRemote(fromServerSearch(q, res.data));
      });
    }, ASK_DELAY);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q]);

  function search(next: string) {
    setRemote(null);
    setValue(next);
  }

  return (
    <>
      <PageHeader title={copy.nav.find} />
      <SearchInput
        inputRef={input}
        placeholder={copy.notes.findPlaceholder}
        autoFocus={false}
        value={value}
        onChange={(next) => {
          search(next);
          if (!next) input.current?.focus();
        }}
        onEnter={() => {
          void rememberSearch(value);
          input.current?.blur();
        }}
      />
      <SyncStatus />
      <div className={styles.results} aria-live="polite">
        {!q ? (
          <RecentChips
            onPick={(r) => {
              search(r);
              input.current?.focus();
            }}
          />
        ) : (
          <FindOutcome q={q} notes={notes} state={state} remote={remote} onRetry={retry} />
        )}
      </div>
    </>
  );
}
