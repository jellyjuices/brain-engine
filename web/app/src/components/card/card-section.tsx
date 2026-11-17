import type { ReactNode } from "react";
import { cardBody, cardSection } from "./card.styles.ts";

export function CardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={cardSection}>
      <h3 className="section-label">{label}</h3>
      <div className={cardBody}>{children}</div>
    </div>
  );
}
