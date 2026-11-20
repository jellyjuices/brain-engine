import type { ReactNode } from "react";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { FileWorking } from "./file-working.tsx";

export function FileSection({
  title,
  count,
  busy,
  children,
}: {
  title: string;
  count?: number;
  busy: string | false;
  children: ReactNode;
}) {
  return (
    <section>
      <SectionHeader title={title} count={busy ? undefined : count} />
      {busy ? <FileWorking title={busy} /> : children}
    </section>
  );
}
