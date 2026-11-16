import "./tool-bar.css";
import type { ReactNode } from "react";

export function ToolBar({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="tool-bar">
      {meta}
      <div className="tool-bar-tools" role="toolbar" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
