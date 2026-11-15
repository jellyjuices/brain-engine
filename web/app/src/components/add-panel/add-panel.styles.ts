import { css } from "@linaria/core";
import { shape } from "@/components/shape/shape.tsx";

export const label = css`
  --add-part: label;
`;

export const main = css`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  min-height: var(--size-target);
  padding: var(--space-xs) 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  touch-action: none;
  user-select: none;
  -webkit-touch-callout: none;

  & .${shape} {
    margin-top: calc(var(--size-icon) * -1);
    transition: transform var(--motion-fast) var(--motion-easing);
  }

  & .${shape} > svg {
    transition: transform var(--motion-fast) var(--motion-easing);
  }

  &:active .${shape} {
    transform: scale(0.94);
  }
`;

export const scrim = css`
  position: fixed;
  inset: 0;
  z-index: 1;
  border: 0;
  background: var(--background-scrim);
`;

export const blob = css`
  position: fixed;
  --add-blob-w: 520px;
  --add-blob-h: 520px;
  top: calc(
    var(--vvt, 0) + var(--vvh, 100dvh) - var(--size-tabbar) / 2 - env(safe-area-inset-bottom) -
      var(--add-blob-h) / 2
  );
  left: 50%;
  z-index: 2;
  width: var(--add-blob-w);
  height: var(--add-blob-h);
  margin-left: calc(var(--add-blob-w) / -2);
  transition:
    top var(--motion-slow) var(--motion-easing),
    width var(--motion-slow) var(--motion-easing),
    height var(--motion-slow) var(--motion-easing),
    margin-left var(--motion-slow) var(--motion-easing);
  animation: add-inflate var(--motion-pop) var(--motion-easing) both;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--background-accent);
    clip-path: var(--shape-plus);
    animation: add-spin 40s linear infinite;
  }

  .shell--wide & {
    top: calc(var(--vvt, 0) + var(--vvh, 100dvh) / 2 - var(--add-blob-h) / 2);
    left: calc(240px + var(--space-lg));
    margin-left: 0;
  }

  @keyframes add-spin {
    to {
      rotate: 1turn;
    }
  }

  @keyframes add-inflate {
    from {
      transform: scale(0.15);
    }
  }

  @keyframes add-morph {
    from {
      transform: scale(0.9);
    }
  }

  @keyframes add-deflate {
    to {
      opacity: 0;
      transform: scale(0.15);
    }
  }

  @keyframes add-fade {
    to {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

export const blobTodo = css`
  .${blob}& {
    animation: add-morph var(--motion-pop) var(--motion-easing) both;
  }

  .${blob}&::before {
    clip-path: var(--shape-kind-todo);
  }
`;

export const blobJournal = css`
  .${blob}& {
    --add-blob-w: 120vw;
    --add-blob-h: 120vw;
    top: calc(
      var(--vvt, 0) + var(--vvh, 100dvh) - var(--size-tabbar) / 2 - env(safe-area-inset-bottom) -
        var(--add-blob-h) * 0.8
    );
    transform-origin: 50% 80%;
    animation: add-morph var(--motion-pop) var(--motion-easing) both;
  }

  .${blob}&::before {
    clip-path: var(--shape-kind-journal);
    animation: none;
  }

  .shell--wide .${blob}& {
    --add-blob-w: 520px;
    --add-blob-h: 520px;
    top: calc(var(--vvt, 0) + var(--vvh, 100dvh) / 2 - var(--add-blob-h) / 2);
    transform-origin: 50% 50%;
  }
`;

export const blobFull = css`
  .${blob}& {
    --add-blob-w: max(calc(var(--vvh, 100dvh) / 0.7), 100vw);
    --add-blob-h: var(--add-blob-w);
    top: calc(var(--vvt, 0) - var(--add-blob-h) * 0.3);
  }
`;

export const panel = css`
  position: relative;
  display: flex;
  justify-content: center;
`;

export const modeOpen = css`
  .${panel}& .${main} .${shape} > svg {
    transform: rotate(45deg);
  }
`;

export const modeTodo = css`
  --add-mode: todo;
`;

export const modeJournal = css`
  --add-mode: journal;
`;

export const notClosed = css`
  .${panel}& .${main} .${label} {
    visibility: hidden;
  }
`;

export const closing = css`
  .${panel}& .${blob} {
    animation: add-deflate var(--motion-fast) cubic-bezier(0.5, 0, 0.75, 0) both;
  }

  .${panel}& .${scrim} {
    animation: add-fade var(--motion-fast) cubic-bezier(0.5, 0, 0.75, 0) both;
  }

  .${panel}& .${main} .${shape} > svg {
    transform: none;
  }
`;
