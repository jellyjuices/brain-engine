import { CaretRightIcon, CircleNotchIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { MouseEvent, ReactNode } from "react";
import clsx from "clsx";
import { Checkbox } from "@/components/checkbox/checkbox.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import styles from "./list-row.module.css";
import { KindIcon, type KindIconName } from "@/components/kind-icon/kind-icon.tsx";

export interface ListRowProps {
  title: ReactNode;
  sub?: ReactNode;
  icon?: PhosphorIcon;
  shape?: Exclude<KindIconName, "add">;
  end?: ReactNode;
  variant?: "default" | "primary" | "danger";
  chevron?: boolean;
  href?: string;
  label?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  busy?: boolean;
  checked?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export function ListRow({
  title,
  sub,
  icon,
  shape,
  end,
  variant = "default",
  chevron,
  href,
  label,
  autoFocus,
  hidden,
  busy,
  checked,
  onClick,
}: ListRowProps) {
  const className = clsx(
    styles.row,
    variant === "primary" && styles.primary,
    variant === "danger" && styles.danger,
    busy && styles.busy,
  );
  const inner = (
    <>
      {checked !== undefined && <Checkbox shape="square" checked={checked} />}
      {icon && shape && <KindIcon name={shape} icon={icon} />}
      {icon && !shape && (
        <span className={styles.icon}>
          <Icon icon={icon} />
        </span>
      )}
      <span className={styles.main}>
        <span className={styles.title}>{title}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </span>
      {(end || chevron || busy) && (
        <span className={styles.end}>
          {end}
          {busy && <Icon icon={CircleNotchIcon} />}
          {chevron && <Icon icon={CaretRightIcon} />}
        </span>
      )}
    </>
  );
  if (href)
    return (
      <a className={className} href={href} aria-label={label} hidden={hidden} onClick={onClick}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button
        className={className}
        type="button"
        aria-label={label}
        aria-pressed={checked}
        autoFocus={autoFocus}
        hidden={hidden}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  return (
    <div className={className} hidden={hidden} aria-busy={busy || undefined}>
      {inner}
    </div>
  );
}
