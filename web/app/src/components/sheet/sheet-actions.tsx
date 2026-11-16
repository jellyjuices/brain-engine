import "./sheet.css";
import type { ReactNode } from "react";

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="sheet-actions">{children}</div>;
}
