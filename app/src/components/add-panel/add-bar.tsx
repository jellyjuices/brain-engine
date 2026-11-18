import styles from "./add-bar.module.css";
import {
  AtIcon,
  HashIcon,
  ListBulletsIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import type { ReactNode, SyntheticEvent } from "react";
import { AddTool } from "./add-tool.tsx";
import { copy } from "@/content/index.ts";

export interface AddBarActions {
  bold: () => void;
  italic: () => void;
  list: () => void;
  tag: () => void;
  link: () => void;
}

function keepFocus(e: SyntheticEvent) {
  e.preventDefault();
}

export function AddBar({
  journal,
  actions,
  drawer,
  end,
}: {
  journal: boolean;
  actions: AddBarActions;
  drawer: ReactNode;
  end: ReactNode;
}) {
  return (
    <div className={styles.addBar} onPointerDown={keepFocus} onMouseDown={keepFocus}>
      {drawer}
      <div className={styles.tools} role="toolbar" aria-label={copy.add.format}>
        <AddTool icon={TextBIcon} label={copy.add.bold} onClick={actions.bold} />
        <AddTool icon={TextItalicIcon} label={copy.add.italic} onClick={actions.italic} />
        {journal && <AddTool icon={ListBulletsIcon} label={copy.add.list} onClick={actions.list} />}
        <AddTool icon={HashIcon} label={copy.common.tag} onClick={actions.tag} />
        <AddTool icon={AtIcon} label={copy.add.mention} onClick={actions.link} />
        <div className={styles.end}>{end}</div>
      </div>
    </div>
  );
}
