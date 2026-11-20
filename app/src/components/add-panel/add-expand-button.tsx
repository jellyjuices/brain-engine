import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import { AddToolbarButton } from "./add-toolbar-button.tsx";
import { copy } from "@/content/index.ts";

export function AddExpandButton({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  return (
    <AddToolbarButton
      icon={full ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
      label={full ? copy.add.smaller : copy.add.fullScreen}
      pressed={full}
      onClick={onToggle}
    />
  );
}
