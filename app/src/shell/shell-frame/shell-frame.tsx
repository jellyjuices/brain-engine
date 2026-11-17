import styles from "./shell-frame.module.css";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Rail } from "@/shell/rail/rail.tsx";
import { MAIN_ID, SkipLink } from "@/shell/skip-link/skip-link.tsx";
import { TabBar } from "@/shell/tab-bar/tab-bar.tsx";
import { useShellLayout } from "@/shell/use-shell-layout.ts";

export function ShellFrame({ children }: { children: ReactNode }) {
  const layout = useShellLayout();
  const wide = layout === "wide";
  return (
    <div className={clsx(styles.shell, wide && styles.wide)} data-layout={layout}>
      <SkipLink />
      {wide && <Rail />}
      <div id={MAIN_ID} className={styles.main} tabIndex={-1}>
        {children}
      </div>
      {!wide && <TabBar />}
    </div>
  );
}
