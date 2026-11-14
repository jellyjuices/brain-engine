import "./shape.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

export type ShapeName =
  "add" | "todo" | "journal" | "person" | "place" | "thing" | "file" | "intake" | "other";

export interface ShapeProps {
  name: ShapeName;
  icon?: PhosphorIcon;
  size?: "md" | "lg";
  variant?: "default" | "primary" | "secondary";
}

export function Shape({ name, icon, size = "md", variant = "default" }: ShapeProps) {
  return (
    <span className={clsx("shape", `shape--${size}`, variant !== "default" && `shape--${variant}`)}>
      <span className="shape-bg" style={{ clipPath: `var(--shape-kind-${name})` }} />
      {icon && <Icon icon={icon} />}
    </span>
  );
}
