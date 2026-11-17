import "./toast.css";
import { useSyncExternalStore } from "react";
import { subscribeToasts, toastSnapshot } from "./toast-store.ts";
import { ToastCard } from "./toast-card.tsx";

export function Toasts() {
  const items = useSyncExternalStore(subscribeToasts, toastSnapshot);
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false" role="status">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
