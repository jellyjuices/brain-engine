import "./card.css";
import type { ReactNode } from "react";

export function CardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="card-sec">
      <h3 className="section-label">{label}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
