import { useEffect } from "react";
import { toStored } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { putNotes } from "@/lib/storage/store.ts";
import { api } from "@/lib/sync/api.ts";
import { notePath } from "@/lib/sync/writes.ts";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { copy } from "@/content/index.ts";

export function NoteMissing({ path }: { path: string }) {
  useEffect(() => {
    let alive = true;
    void api<Record<string, unknown>>(notePath(path)).then((res) => {
      if (alive && res.ok) void putNotes([toStored(res.data)]);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return (
    <>
      <PageHeader title={copy.nav.note} onBack={() => back()} />
      <EmptyState title={copy.notes.missingTitle} body={copy.notes.missingBody} />
    </>
  );
}
