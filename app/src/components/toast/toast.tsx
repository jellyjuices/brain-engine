import clsx from "clsx";
import { Toast as RadixToast } from "radix-ui";
import {
  BellSimpleIcon,
  CheckIcon,
  InfoIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ToastAction } from "./toast-store.ts";
import styles from "./toast.module.css";

export type ToastVariant = "success" | "deleted" | "error" | "warning" | "info" | "neutral";

const icons: Record<ToastVariant, Icon> = {
  success: CheckIcon,
  deleted: TrashIcon,
  error: XIcon,
  warning: WarningIcon,
  info: InfoIcon,
  neutral: BellSimpleIcon,
};

export function ToastProvider({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <RadixToast.Provider swipeDirection="right" label={label}>
      {children}
      <RadixToast.Viewport className={styles.viewport} />
    </RadixToast.Provider>
  );
}

export type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  detail?: string;
  variant?: ToastVariant;
  icon?: Icon;
  actions?: ToastAction[];
  duration?: number;
};

export function Toast({
  open,
  onOpenChange,
  message,
  detail,
  variant = "success",
  icon,
  actions = [],
  duration = 5000,
}: ToastProps) {
  const Glyph = icon ?? icons[variant];
  return (
    <RadixToast.Root
      className={clsx(styles.toast, styles[variant])}
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      type={variant === "error" ? "foreground" : "background"}
    >
      <span className={styles.badge} aria-hidden>
        <span className={styles.shape} />
        <Glyph weight="regular" className={styles.icon} />
      </span>
      <div className={styles.text}>
        <RadixToast.Title className={styles.title}>{message}</RadixToast.Title>
        {detail && (
          <RadixToast.Description className={styles.detail}>{detail}</RadixToast.Description>
        )}
      </div>
      {actions.map((a) => (
        <RadixToast.Action
          key={a.label}
          className={styles.action}
          altText={a.label}
          onClick={a.onClick}
        >
          {a.label}
        </RadixToast.Action>
      ))}
    </RadixToast.Root>
  );
}
