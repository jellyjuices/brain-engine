import styles from "./shape.module.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import type { KindName } from "@/lib/notes/kinds.ts";

export type ShapeName = "add" | KindName;

const KIND_SHAPE: Record<string, string> = {
  add: "cookie",
  todo: "scallop",
  journal: "blossom",
  person: "egg",
  place: "clover",
  thing: "puff",
  file: "hexagon",
  intake: "flower",
  other: "circle",
  area: "pebble",
  project: "squircle",
  group: "house",
  topic: "triad",
  event: "burst",
  note: "diamond",
  goal: "star",
  decision: "octagon",
  capture: "shield",
  lens: "arch",
};

export interface ShapeProps {
  name: ShapeName;
  icon?: PhosphorIcon;
  size?: "md" | "lg";
  variant?: "default" | "primary" | "secondary";
}

export function Shape({ name, icon, size = "md", variant = "default" }: ShapeProps) {
  return (
    <span
      className={clsx(
        styles.shape,
        name === "group" && styles.shapeHouse,
        size === "lg" && styles.shapeLg,
        variant === "primary" && styles.shapePrimary,
        variant === "secondary" && styles.shapeSecondary,
      )}
    >
      <span
        className={styles.shapeBg}
        style={{ clipPath: `var(--shape-${KIND_SHAPE[name] ?? "circle"})` }}
      />
      {icon && <Icon icon={icon} />}
    </span>
  );
}
