import "./add-arc.css";
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
    <div className="add-arc" role="menu" aria-label={copy.add.newTitle}>
      <button
        type="button"
        role="menuitem"
        className="add-arc-pick add-arc-pick--1"
        onClick={onTodo}
      >
        <Shape name="todo" icon={CheckSquareIcon} size="lg" />
        <span>{copy.add.todo}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="add-arc-pick add-arc-pick--2"
        onClick={onJournal}
      >
        <Shape name="journal" icon={BookOpenIcon} size="lg" />
        <span>{copy.add.journal}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="add-arc-pick add-arc-pick--3"
        onClick={onOther}
      >
        <Shape name="other" icon={DotsThreeIcon} size="lg" />
        <span>{copy.add.other}</span>
      </button>
    </div>
  );
}
