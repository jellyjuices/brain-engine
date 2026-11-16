import { css } from "@linaria/core";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

export type ShapeName =
  "add" | "todo" | "journal" | "person" | "place" | "thing" | "file" | "intake" | "other";

export const shapeBg = css`
  position: absolute;
  inset: 0;
  background: var(--background-accent-soft);
`;

export const shape = css`
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  color: var(--text-primary);

  & > svg {
    position: relative;
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

const sizes = {
  md: "",
  lg: css`
    width: var(--size-plus);
    height: var(--size-plus);

    & > svg {
      width: var(--size-icon);
      height: var(--size-icon);
    }
  `,
};

const names: Partial<Record<ShapeName, string>> = {
  journal: css`
    & .${shapeBg} {
      translate: 0 -7%;
      transform-origin: 50% 57%;
    }
  `,
  person: css`
    & .${shapeBg} {
      translate: 0 -5%;
      transform-origin: 50% 55%;
    }
  `,
};

const variants = {
  default: "",
  primary: css`
    color: var(--text-on-accent);

    & .${shapeBg} {
      background: var(--background-accent);
    }
  `,
  secondary: css`
    color: var(--text-accent);

    & .${shapeBg} {
      background: color-mix(in srgb, var(--text-accent) 14%, var(--background-secondary));
    }
  `,
};

function kindVar(name: ShapeName) {
  return name === "add" ? "var(--shape-plus)" : `var(--shape-kind-${name})`;
}

export interface ShapeProps {
  name: ShapeName;
  icon?: PhosphorIcon;
  size?: "md" | "lg";
  variant?: "default" | "primary" | "secondary";
}

export function Shape({ name, icon, size = "md", variant = "default" }: ShapeProps) {
  return (
    <span className={clsx(shape, names[name], sizes[size], variants[variant])}>
      <span className={shapeBg} style={{ clipPath: kindVar(name) }} />
      {icon && <Icon icon={icon} />}
    </span>
  );
}
