import { useEffect, useState } from "react";
import { toStored } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { putNotes } from "@/lib/storage/store.ts";
import { api } from "@/lib/sync/api.ts";
import { failed } from "@/lib/sync/loaded.ts";
import { notePath } from "@/lib/sync/writes.ts";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { copy } from "@/content/index.ts";

type Outcome = "missing" | "offline" | "error";

export function NoteMissing({ path }: { path: string }) {
  const [outcome, setOutcome] = useState<Outcome>("missing");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    void api<Record<string, unknown>>(notePath(path)).then((res) => {
      if (!alive) return;
      if (res.ok) void putNotes([toStored(res.data)]);
      else setOutcome(failed(res).kind);
    });
    return () => {
      alive = false;
    };
  }, [path, attempt]);
  return (
    <>
      <PageHeader title={copy.nav.note} onBack={() => back()} />
      {outcome === "offline" && <EmptyState kind="offline" />}
      {outcome === "error" && (
        <EmptyState
          kind="error"
          what={copy.states.thisNote}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}
      {outcome === "missing" && (
        <EmptyState title={copy.notes.missingTitle} body={copy.notes.missingBody} />
      )}
    </>
  );
}
