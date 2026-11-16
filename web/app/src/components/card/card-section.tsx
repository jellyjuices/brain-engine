import { cardBody, cardSec } from "./card.styles.ts";
import type { ReactNode } from "react";

export function CardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={cardSec}>
      <h3 className="section-label">{label}</h3>
      <div className={cardBody}>{children}</div>
    </div>
  );
}
