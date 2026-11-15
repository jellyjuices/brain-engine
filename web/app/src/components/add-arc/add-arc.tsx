import { css } from "@linaria/core";
import clsx from "clsx";
import { BookOpenIcon, CheckSquareIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { Shape, shape, shapeBg } from "@/components/shape/shape.tsx";
import { copy } from "@/content/index.ts";

const arc = css`
  position: absolute;
  bottom: 50%;
  left: 50%;
`;

const pick = css`
  --add-arc: 120px;
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  border: 0;
  background: transparent;
  color: var(--text-on-accent);
  font: inherit;
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  translate: -50% 0;
  animation: add-arc-pop var(--motion-fast) var(--motion-easing) both;

  & .${shape} {
    color: var(--text-accent);
  }

  & .${shapeBg} {
    animation: add-arc-spin 40s linear infinite;
    background: var(--background-secondary);
  }

  @keyframes add-arc-pop {
    from {
      opacity: 0;
      scale: 0.4;
    }
  }

  @keyframes add-arc-spin {
    to {
      rotate: 1turn;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    & .${shapeBg} {
      animation: none;
    }
  }
`;

const places = [
  css`
    transform: translate(calc(var(--add-arc) * -0.87), calc(var(--add-arc) * -0.5));
  `,
  css`
    transform: translate(0, calc(var(--add-arc) * -1));
  `,
  css`
    transform: translate(calc(var(--add-arc) * 0.87), calc(var(--add-arc) * -0.5));
  `,
];

export interface AddArcProps {
  onTodo: () => void;
  onJournal: () => void;
  onOther: () => void;
}

export function AddArc({ onTodo, onJournal, onOther }: AddArcProps) {
  return (
    <div className={arc} role="menu" aria-label={copy.add.newTitle}>
      <button type="button" role="menuitem" className={clsx(pick, places[0])} onClick={onTodo}>
        <Shape name="todo" icon={CheckSquareIcon} size="lg" />
        <span>{copy.add.todo}</span>
      </button>
      <button type="button" role="menuitem" className={clsx(pick, places[1])} onClick={onJournal}>
        <Shape name="journal" icon={BookOpenIcon} size="lg" />
        <span>{copy.add.journal}</span>
      </button>
      <button type="button" role="menuitem" className={clsx(pick, places[2])} onClick={onOther}>
        <Shape name="other" icon={DotsThreeIcon} size="lg" />
        <span>{copy.add.other}</span>
      </button>
    </div>
  );
}
