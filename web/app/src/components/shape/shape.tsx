import "./shape.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

export type ShapeName =
  "add" | "todo" | "journal" | "person" | "place" | "thing" | "file" | "intake" | "other";

const PATHS: Record<ShapeName, string> = {
  add: "M20 2a9 9 0 0 1 9 9a9 9 0 0 1 0 18a9 9 0 0 1-18 0a9 9 0 0 1 0-18a9 9 0 0 1 9-9z",
  todo: "M10 2h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V10a8 8 0 0 1 8-8z",
  journal: "M18 2h16a4 4 0 0 1 4 4v14a18 18 0 0 1-18 18H6a4 4 0 0 1-4-4V18A16 16 0 0 1 18 2z",
  person: "M20 2a18 18 0 1 1 0 36a18 18 0 1 1 0-36z",
  place: "M20 2a15 15 0 0 1 15 15c0 10-11 19-15 21c-4-2-15-11-15-21A15 15 0 0 1 20 2z",
  thing:
    "M17 3a6 6 0 0 1 6 0l11 6.5a6 6 0 0 1 3 5.2v10.6a6 6 0 0 1-3 5.2L23 37a6 6 0 0 1-6 0L6 30.5a6 6 0 0 1-3-5.2V14.7a6 6 0 0 1 3-5.2z",
  file: "M9 2h16l11 11v19a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z",
  intake: "M10 3h20a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H16l-8 6v-6.4A8 8 0 0 1 2 23V11a8 8 0 0 1 8-8z",
  other: "M16.5 3.5a5 5 0 0 1 7 0l13 13a5 5 0 0 1 0 7l-13 13a5 5 0 0 1-7 0l-13-13a5 5 0 0 1 0-7z",
};

export interface ShapeProps {
  name: ShapeName;
  icon?: PhosphorIcon;
  size?: "md" | "lg";
  variant?: "default" | "primary";
}

export function Shape({ name, icon, size = "md", variant = "default" }: ShapeProps) {
  return (
    <span className={clsx("shape", `shape--${size}`, variant !== "default" && `shape--${variant}`)}>
      <svg className="shape-bg" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <path d={PATHS[name]} />
      </svg>
      {icon && <Icon icon={icon} />}
    </span>
  );
}
