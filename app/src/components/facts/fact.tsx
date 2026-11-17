import "./facts.css";
import "@/components/tile/tile.css";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { copy } from "@/content/index.ts";

export interface FactProps {
  icon: PhosphorIcon;
  label: string;
  children: ReactNode;
  sub?: string;
}

export function Fact({ icon, label, children, sub }: FactProps) {
  return (
    <div className="tile fact">
      <span className="fact-icon">
        <Icon icon={icon} />
      </span>
      <div className="fact-text">
        <dt className="section-label">{label}</dt>
        <dd className="fact-main">
          {children}
          {sub && <span className="fact-sub">{sub}</span>}
        </dd>
      </div>
    </div>
  );
}

export function AddFact({
  icon,
  label,
  onClick,
}: {
  icon: PhosphorIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="tile tile--dashed fact"
      type="button"
      aria-label={copy.common.addItem(label.toLowerCase())}
      onClick={onClick}
    >
      <span className="fact-icon">
        <Icon icon={icon} />
      </span>
      <span className="fact-text">
        <span className="section-label">{label}</span>
        <span className="fact-add-label">{copy.common.add}</span>
      </span>
    </button>
  );
}
