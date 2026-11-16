import "./empty.css";
import clsx from "clsx";
import type { Size } from "@/components/button/button.tsx";

export interface EmptyProps {
  title: string;
  body?: string;
  size?: Exclude<Size, "lg">;
}

export function Empty({ title, body, size = "md" }: EmptyProps) {
  return (
    <div className={clsx("empty", size === "sm" && "empty--sm")}>
      <p className="empty-title serif">{title}</p>
      {body && <p className="lede">{body}</p>}
    </div>
  );
}
