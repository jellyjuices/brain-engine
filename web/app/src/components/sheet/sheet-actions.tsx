import { actions } from "./sheet.styles.ts";
import type { ReactNode } from "react";

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className={actions}>{children}</div>;
}
