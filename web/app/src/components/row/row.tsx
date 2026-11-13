import "./row.css";
import { CaretRightIcon, CircleNotchIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { MouseEvent, ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

export interface RowProps {
  title: ReactNode;
  sub?: ReactNode;
  icon?: PhosphorIcon;
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
  const className = clsx("row", variant !== "default" && `row--${variant}`, busy && "is-busy");
  const inner = (
    <>
      {icon && (
        <span className="row-icon">
          <Icon icon={icon} />
        </span>
      )}
      <span className="row-main">
        <span className="row-title">{title}</span>
        {sub && <span className="row-sub">{sub}</span>}
      </span>
      {(end || chevron || busy) && (
        <span className="row-end">
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
