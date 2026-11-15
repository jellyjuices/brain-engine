import clsx from "clsx";
import { tile, tileDashed } from "@/components/tile/tile.tsx";
import * as s from "./facts.styles.ts";
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
    <div className={clsx(tile, s.fact)}>
      <span className={s.factIcon}>
        <Icon icon={icon} />
      </span>
      <div className={s.factText}>
        <dt className="section-label">{label}</dt>
        <dd className={s.factMain}>
          {children}
          {sub && <span className={s.factSub}>{sub}</span>}
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
      className={clsx(tile, tileDashed, s.fact)}
      type="button"
      aria-label={copy.common.addItem(label.toLowerCase())}
      onClick={onClick}
    >
      <span className={s.factIcon}>
        <Icon icon={icon} />
      </span>
      <span className={s.factText}>
        <span className="section-label">{label}</span>
        <span className={s.factAddLabel}>{copy.common.add}</span>
      </span>
    </button>
  );
}
