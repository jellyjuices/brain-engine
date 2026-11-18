import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import { AddTool } from "./add-tool.tsx";
import { copy } from "@/content/index.ts";

export function AddFull({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  return (
    <AddTool
      icon={full ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
      label={full ? copy.add.smaller : copy.add.fullScreen}
      pressed={full}
      onClick={onToggle}
    />
  );
}
