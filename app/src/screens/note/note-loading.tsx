import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { back } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export function NoteLoading() {
  return (
    <>
      <PageHeader title={copy.nav.note} onBack={() => back()} />
      <EmptyState kind="loading" what={copy.states.thisNote} />
    </>
  );
}
