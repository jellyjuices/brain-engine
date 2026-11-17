import type { ReactNode } from "react";
import { SectionHeader } from "@ds/components/section-header/section-header.tsx";

export interface GoalSectionProps {
  title: string;
  count?: number;
  children: ReactNode;
}

export function GoalSection({ title, count, children }: GoalSectionProps) {
  return (
    <section aria-label={title}>
      <SectionHeader title={title} count={count} />
      {children}
    </section>
  );
}
