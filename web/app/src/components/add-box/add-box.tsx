import { css } from "@linaria/core";
import type { Ref } from "react";
import clsx from "clsx";
import { copy } from "@/content/index.ts";

const box = css`
  position: absolute;
  inset-block: 22% 58%;
  inset-inline: calc((var(--add-blob-w) - 100vw) / 2 + var(--space-xl));
  overflow-y: auto;
  color: var(--text-on-accent);
  font-size: var(--font-size-body-md);
  line-height: var(--font-leading-normal);
  white-space: pre-wrap;
  outline: none;
  transition: inset var(--motion-slow) var(--motion-easing);

  &:empty::before {
    content: attr(data-placeholder);
    opacity: 0.7;
  }

  @keyframes add-edges {
    0% {
      --add-fade-top: 0;
      --add-fade-bottom: var(--space-xl);
    }
    8%,
    92% {
      --add-fade-top: var(--space-xl);
      --add-fade-bottom: var(--space-xl);
    }
    100% {
      --add-fade-top: var(--space-xl);
      --add-fade-bottom: 0;
    }
  }
`;

const journal = css`
  inset-block: 30% calc(20% + var(--size-tabbar));
  mask-image: linear-gradient(
    transparent,
    black var(--add-fade-top),
    black calc(100% - var(--add-fade-bottom)),
    transparent
  );
  animation: add-edges linear both;
  animation-timeline: scroll(self);
`;

const full = css`
  .${box}& {
    inset-block: calc(30% + 40px)
      calc(70% - var(--vvh, 100dvh) + var(--size-tabbar) + env(safe-area-inset-bottom) + 40px);
  }
`;

export interface AddBoxProps {
  ref: Ref<HTMLDivElement>;
  kind: "todo" | "journal";
  full: boolean;
}

export function AddBox({ ref, kind, full: isFull }: AddBoxProps) {
  const todo = kind === "todo";
  return (
    <div
      ref={ref}
      className={clsx(box, !todo && journal, isFull && full)}
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-label={todo ? copy.add.todo : copy.add.journal}
      data-placeholder={todo ? copy.add.todoHint : copy.add.writePlaceholder}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
    />
  );
}
