import styles from "./add-bar.module.css";
import {
  AtIcon,
  HashIcon,
  ListBulletsIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import type { ReactNode, SyntheticEvent } from "react";
import { IconButton } from "@/components/icon-button/icon-button.tsx";
import { ToolBar } from "@/components/tool-bar/tool-bar.tsx";
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
      <ToolBar label={copy.add.format}>
        <div className={styles.tools}>
          <IconButton icon={TextBIcon} label={copy.add.bold} onClick={actions.bold} />
          <IconButton icon={TextItalicIcon} label={copy.add.italic} onClick={actions.italic} />
          {journal && (
            <IconButton icon={ListBulletsIcon} label={copy.add.list} onClick={actions.list} />
          )}
          <IconButton icon={HashIcon} label={copy.common.tag} onClick={actions.tag} />
          <IconButton icon={AtIcon} label={copy.add.mention} onClick={actions.link} />
          <div className={styles.end}>{end}</div>
        </div>
      </ToolBar>
    </div>
  );
}
