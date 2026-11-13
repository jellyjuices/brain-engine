import { useEffect } from "react";
import { toStored } from "@/lib/notes/model.ts";
import { back } from "@/lib/platform/router.ts";
import { putNotes } from "@/lib/storage/store.ts";
import { api } from "@/lib/sync/api.ts";
import { notePath } from "@/lib/sync/writes.ts";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { Empty } from "@/components/empty/empty.tsx";
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
      <ScreenHead title={copy.nav.note} onBack={() => back()} />
      <Empty title={copy.notes.missingTitle} body={copy.notes.missingBody} />
    </>
  );
}
