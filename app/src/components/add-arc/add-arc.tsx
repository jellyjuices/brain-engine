import styles from "./add-arc.module.css";
import clsx from "clsx";
import { BookOpenIcon, CheckSquareIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { Shape } from "@/components/shape/shape.tsx";
import { copy } from "@/content/index.ts";

export interface AddArcProps {
  onTodo: () => void;
  onJournal: () => void;
  onOther: () => void;
}

export function AddArc({ onTodo, onJournal, onOther }: AddArcProps) {
  return (
    <div className={styles.addArc} role="menu" aria-label={copy.add.newTitle}>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addArcPick, styles.addArcPick1)}
        onClick={onTodo}
      >
        <Shape name="todo" icon={CheckSquareIcon} size="lg" />
        <span>{copy.add.todo}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addArcPick, styles.addArcPick2)}
        onClick={onJournal}
      >
        <Shape name="journal" icon={BookOpenIcon} size="lg" />
        <span>{copy.add.journal}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={clsx(styles.addArcPick, styles.addArcPick3)}
        onClick={onOther}
      >
        <Shape name="other" icon={DotsThreeIcon} size="lg" />
        <span>{copy.add.other}</span>
      </button>
    </div>
  );
}
