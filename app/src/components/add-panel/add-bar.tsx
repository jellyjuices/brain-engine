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
        <IconButton
          icon={TextBIcon}
          label={copy.add.bold}
          variant="secondary"
          onClick={actions.bold}
        />
        <IconButton
          icon={TextItalicIcon}
          label={copy.add.italic}
          variant="secondary"
          onClick={actions.italic}
        />
        {journal && (
          <IconButton
            icon={ListBulletsIcon}
            label={copy.add.list}
            variant="secondary"
            onClick={actions.list}
          />
        )}
        <IconButton
          icon={HashIcon}
          label={copy.common.tag}
          variant="secondary"
          onClick={actions.tag}
        />
        <IconButton
          icon={AtIcon}
          label={copy.add.mention}
          variant="secondary"
          onClick={actions.link}
        />
        <div className={styles.end}>{end}</div>
      </div>
    </div>
  );
}
