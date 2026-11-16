import { css } from "@linaria/core";
import { blob } from "./add-panel.styles.ts";

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
      var(--vvt, 0) + var(--vvh, 100dvh) - var(--size-tabbar) /
        2 - env(safe-area-inset-bottom) - var(--add-blob-h) * 0.8
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
