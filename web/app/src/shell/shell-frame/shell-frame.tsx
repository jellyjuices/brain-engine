import "./shell-frame.css";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Rail } from "@/shell/rail/rail.tsx";
import { MAIN_ID, SkipLink } from "@/shell/skip-link/skip-link.tsx";
import { TabBar } from "@/shell/tab-bar/tab-bar.tsx";
import { TopBar } from "@/shell/top-bar/top-bar.tsx";
import { UnsortedBanner } from "@/shell/unsorted-banner/unsorted-banner.tsx";
import { useShellLayout } from "@/shell/use-shell-layout.ts";

export function ShellFrame({ children }: { children: ReactNode }) {
  const layout = useShellLayout();
  const wide = layout === "wide";
  return (
    <div className={clsx("shell", `shell--${layout}`)}>
      <SkipLink />
      {wide && <Rail />}
      <div id={MAIN_ID} className="shell-main" tabIndex={-1}>
        {!wide && <TopBar />}
        <UnsortedBanner />
        {children}
      </div>
      {!wide && <TabBar />}
    </div>
  );
}
