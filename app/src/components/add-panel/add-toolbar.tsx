import styles from "./add-toolbar.module.css";
import {
  AtIcon,
  CalendarDotsIcon,
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
  date: () => void;
  link: () => void;
}

function keepFocus(e: SyntheticEvent) {
  e.preventDefault();
}

export type AddToolbarPressed = Record<
  "bold" | "italic" | "list" | "tag" | "date" | "mention",
  boolean
>;

export function AddToolbar({
  journal,
  actions,
  pressed,
  drawer,
  end,
}: {
  journal: boolean;
  actions: AddToolbarActions;
  pressed: AddToolbarPressed;
  drawer: ReactNode;
  end: ReactNode;
}) {
  return (
    <div className={styles.addToolbar} onPointerDown={keepFocus} onMouseDown={keepFocus}>
      {drawer}
      <div className={styles.tools} role="toolbar" aria-label={copy.add.format}>
        <AddToolbarButton
          icon={TextBIcon}
          label={copy.add.bold}
          pressed={pressed.bold}
          onClick={actions.bold}
        />
        <AddToolbarButton
          icon={TextItalicIcon}
          label={copy.add.italic}
          pressed={pressed.italic}
          onClick={actions.italic}
        />
        {journal && (
          <AddToolbarButton
            icon={ListBulletsIcon}
            label={copy.add.list}
            pressed={pressed.list}
            onClick={actions.list}
          />
        )}
        <AddToolbarButton
          icon={HashIcon}
          label={copy.common.tag}
          pressed={pressed.tag}
          onClick={actions.tag}
        />
        <AddToolbarButton
          icon={CalendarDotsIcon}
          label={copy.notes.insertDate}
          pressed={pressed.date}
          onClick={actions.date}
        />
        <AddToolbarButton
          icon={AtIcon}
          label={copy.add.mention}
          pressed={pressed.mention}
          onClick={actions.link}
        />
        <div className={styles.end}>{end}</div>
      </div>
    </div>
  );
}
