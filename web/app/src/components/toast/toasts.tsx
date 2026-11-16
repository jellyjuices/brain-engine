import { css } from "@linaria/core";
import { useSyncExternalStore } from "react";
import { subscribeToasts, toastSnapshot } from "./toast-store.ts";
import { ToastCard } from "./toast-card.tsx";

const toasts = css`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--size-tabbar) + env(safe-area-inset-bottom) + var(--space-lg));
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: 0 var(--space-lg);
  pointer-events: none;

  [data-keyboard] & {
    bottom: calc(var(--size-tabbar) + var(--space-2xl));
  }
`;

export function Toasts() {
  const items = useSyncExternalStore(subscribeToasts, toastSnapshot);
  return (
    <div className={toasts} aria-live="polite" aria-atomic="false" role="status">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
