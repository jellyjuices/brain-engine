import styles from "./add-toolbar.module.css";
import {
  AtIcon,
  HashIcon,
  ListBulletsIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import type { ReactNode, SyntheticEvent } from "react";
import { AddToolbarButton } from "./add-toolbar-button.tsx";
import { copy } from "@/content/index.ts";

export interface AddToolbarActions {
  bold: () => void;
  italic: () => void;
  list: () => void;
  tag: () => void;
  link: () => void;
}

function keepFocus(e: SyntheticEvent) {
  e.preventDefault();
}

export function AddToolbar({
  journal,
  actions,
  drawer,
  end,
}: {
  journal: boolean;
  actions: AddToolbarActions;
  drawer: ReactNode;
  end: ReactNode;
}) {
  return (
    <div className={styles.addToolbar} onPointerDown={keepFocus} onMouseDown={keepFocus}>
      {drawer}
      <div className={styles.tools} role="toolbar" aria-label={copy.add.format}>
        <AddToolbarButton icon={TextBIcon} label={copy.add.bold} onClick={actions.bold} />
        <AddToolbarButton icon={TextItalicIcon} label={copy.add.italic} onClick={actions.italic} />
        {journal && (
          <AddToolbarButton icon={ListBulletsIcon} label={copy.add.list} onClick={actions.list} />
        )}
        <AddToolbarButton icon={HashIcon} label={copy.common.tag} onClick={actions.tag} />
        <AddToolbarButton icon={AtIcon} label={copy.add.mention} onClick={actions.link} />
        <div className={styles.end}>{end}</div>
      </div>
    </div>
  );
}
