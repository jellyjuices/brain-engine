import { css } from "@linaria/core";

export const lock = css`
  position: fixed;
  top: var(--vvt, 0);
  left: 0;
  right: 0;
  height: var(--vvh, 100%);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: env(safe-area-inset-top) calc(var(--space-xl) + env(safe-area-inset-right))
    env(safe-area-inset-bottom) calc(var(--space-xl) + env(safe-area-inset-left));
  background: var(--background-primary);
  animation: fade-in var(--motion-slow) var(--motion-easing) both;
`;

export const shaking = css`
  animation: shake 360ms var(--motion-easing);

  @keyframes shake {
    20% {
      transform: translateX(-10px);
    }
    40% {
      transform: translateX(8px);
    }
    60% {
      transform: translateX(-6px);
    }
    80% {
      transform: translateX(3px);
    }
  }
`;

export const panelBox = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 360px;
  gap: var(--space-lg);
`;

export const wordmark = css`
  margin-bottom: var(--space-xl);
  text-align: center;
  font-size: var(--font-size-display-3xl);
  line-height: 1;
  color: var(--text-primary);
`;

export const fieldBox = css`
  position: relative;

  & input {
    width: 100%;
    min-height: 56px;
    padding: 0 calc(var(--size-target) + var(--space-sm)) 0 var(--space-lg);
    border: var(--size-hair) solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--background-secondary);
    font-size: var(--font-size-body-md);
    transition: border-color var(--motion-fast) var(--motion-easing);
  }

  & input:focus-visible {
    border-color: var(--border-focus);
    outline-offset: 0;
  }
`;

export const eye = css`
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
`;

export const errorText = css`
  min-height: var(--space-xl);
  color: var(--text-danger);
  font-size: var(--font-size-body-sm);
  text-align: center;
`;

export const errorInfo = css`
  .${errorText}& {
    color: var(--text-secondary);
  }
`;
