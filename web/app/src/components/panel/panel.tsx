import "./panel.css";
import type { ReactNode } from "react";

export function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="panel" aria-label={label}>
      {children}
    </section>
  );
}
