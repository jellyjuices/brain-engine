import styles from "./empty-state.module.css";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "@/components/button/button.tsx";
import type { Size } from "@/components/button/button.tsx";
import { OfflineBody } from "./offline-body.tsx";
import { copy } from "@/content/index.ts";
import { stateTitle } from "@/content/states.ts";

interface BaseProps {
  body?: string;
  size?: Exclude<Size, "lg">;
  action?: ReactNode;
}

export type EmptyStateProps =
  | (BaseProps & { kind?: "empty"; title: string })
  | (BaseProps & { kind: "loading"; what?: string; title?: string })
  | (BaseProps & { kind: "error"; what?: string; title?: string; onRetry?: () => void })
  | (BaseProps & { kind: "offline"; title?: string });

export function EmptyState(props: EmptyStateProps) {
  const { body, size = "md", action } = props;
  const kind = props.kind ?? "empty";
  const retry = props.kind === "error" ? props.onRetry : undefined;
  const what = props.kind === "loading" || props.kind === "error" ? props.what : undefined;
  const text = kind === "error" && !body ? copy.states.errorBody : body;
  return (
    <div
      className={clsx(
        styles.empty,
        size === "sm" && styles.small,
        kind === "loading" && styles.isLoading,
      )}
      role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}
      aria-busy={kind === "loading" || undefined}
    >
      <p className={styles.title}>{props.title ?? stateTitle(kind, what)}</p>
      {kind === "offline" && !body ? (
        <OfflineBody className={styles.body} />
      ) : (
        text && <p className={styles.body}>{text}</p>
      )}
      {(action || retry) && (
        <div className={styles.action}>
          {action}
          {retry && (
            <Button variant="outlined" onClick={retry}>
              {copy.states.tryAgain}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
