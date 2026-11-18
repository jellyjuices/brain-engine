import { useSyncExternalStore } from "react";
import { closeToast, subscribeToasts, toastSnapshot, type ToastTone } from "./toast-store.ts";
import { Toast, ToastProvider, type ToastVariant } from "./toast.tsx";

const variants: Record<ToastTone, ToastVariant> = { offline: "warning", error: "error" };

export function Toasts() {
  const items = useSyncExternalStore(subscribeToasts, toastSnapshot);
  return (
    <ToastProvider>
      {items.map((t) => (
        <Toast
          key={t.id}
          open={!t.leaving}
          onOpenChange={(open) => open || closeToast(t.id)}
          message={t.message}
          variant={t.tone ? variants[t.tone] : "success"}
          actions={t.actions.map((a) => ({
            label: a.label,
            onClick: () => {
              closeToast(t.id);
              a.onClick();
            },
          }))}
          duration={Infinity}
        />
      ))}
    </ToastProvider>
  );
}
