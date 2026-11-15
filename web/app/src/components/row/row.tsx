import * as s from "./row.styles.ts";
import { CaretRightIcon, CircleNotchIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { MouseEvent, ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { Shape, type ShapeName } from "@/components/shape/shape.tsx";

export interface RowProps {
  title: ReactNode;
  sub?: ReactNode;
  icon?: PhosphorIcon;
  shape?: Exclude<ShapeName, "add">;
  end?: ReactNode;
  variant?: "default" | "primary" | "danger";
  chevron?: boolean;
  href?: string;
  label?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  busy?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export function Row({
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
  onClick,
}: RowProps) {
  const className = clsx(s.row, s.rowVariants[variant], busy && s.rowBusy);
  const inner = (
    <>
      {icon && shape && <Shape name={shape} icon={icon} />}
      {icon && !shape && (
        <span className={s.rowIcon}>
          <Icon icon={icon} />
        </span>
      )}
      <span className={s.rowMain}>
        <span className={s.rowTitle}>{title}</span>
        {sub && <span className={s.rowSub}>{sub}</span>}
      </span>
      {(end || chevron || busy) && (
        <span className={s.rowEnd}>
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
