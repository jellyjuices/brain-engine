import { css } from "@linaria/core";
import clsx from "clsx";
import { mixGradient, mixSplit } from "@/lib/design/area-mix.ts";

export const areaShape = css`
  display: inline-block;
  flex: none;
  width: var(--size-toast-shape);
  height: var(--size-toast-shape);
`;

const sizes = {
  sm: css`
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  `,
  md: "",
  lg: css`
    width: var(--size-plus);
    height: var(--size-plus);
  `,
};

export type AreaShapeProps = {
  areas: string[];
  shape?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export const AreaShape = ({ areas, shape = "cookie", size = "md", label }: AreaShapeProps) => (
  <span
    className={clsx(areaShape, sizes[size])}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    style={{
      clipPath: `var(--shape-${shape})`,
      background: size === "sm" ? mixSplit(areas, "fill") : mixGradient(areas, "fill"),
    }}
  />
);
