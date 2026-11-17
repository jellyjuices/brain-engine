import clsx from "clsx";
import styles from "./facts.module.css";
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
    <div className={styles.fact}>
      <span className={styles.factIcon}>
        <Icon icon={icon} />
      </span>
      <div className={styles.factText}>
        <dt className={styles.factLabel}>{label}</dt>
        <dd className={styles.factMain}>
          {children}
          {sub && <span className={styles.factSub}>{sub}</span>}
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
      className={clsx(styles.fact, styles.factAdd)}
      type="button"
      aria-label={copy.common.addItem(label.toLowerCase())}
      onClick={onClick}
    >
      <span className={styles.factIcon}>
        <Icon icon={icon} />
      </span>
      <span className={styles.factText}>
        <span className={styles.factLabel}>{label}</span>
        <span className={styles.factAddLabel}>{copy.common.add}</span>
      </span>
    </button>
  );
}
