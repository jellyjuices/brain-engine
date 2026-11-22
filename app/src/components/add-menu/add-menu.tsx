import styles from "./add-menu.module.css";
import clsx from "clsx";
import { BookOpenIcon, CheckSquareIcon, DotsThreeIcon, NoteIcon } from "@phosphor-icons/react";
import { KindIcon } from "@/components/kind-icon/kind-icon.tsx";
import { copy } from "@/content/index.ts";

export interface AddMenuProps {
  onTodo: () => void;
  onJournal: () => void;
  onNote: () => void;
  onOther: () => void;
}

export function AddMenu({ onTodo, onJournal, onNote, onOther }: AddMenuProps) {
  return (
    <div className={styles.addMenu} role="menu" aria-label={copy.add.newTitle}>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addMenuPick, styles.addMenuPick1)}
        onClick={onTodo}
      >
        <KindIcon name="todo" icon={CheckSquareIcon} size="lg" />
        <span>{copy.add.todo}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addMenuPick, styles.addMenuPick2)}
        onClick={onJournal}
      >
        <KindIcon name="journal" icon={BookOpenIcon} size="lg" />
        <span>{copy.add.journal}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addMenuPick, styles.addMenuPick3)}
        onClick={onNote}
      >
        <KindIcon name="note" icon={NoteIcon} size="lg" />
        <span>{copy.common.note}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addMenuPick, styles.addMenuPick4)}
        onClick={onOther}
      >
        <KindIcon name="other" icon={DotsThreeIcon} size="lg" />
        <span>{copy.add.other}</span>
      </button>
    </div>
  );
}
