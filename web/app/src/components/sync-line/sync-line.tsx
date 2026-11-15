import { css } from "@linaria/core";
import clsx from "clsx";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncText } from "@/lib/sync/sync-text.ts";

const syncLine = css`
  order: 99;
  margin: var(--space-xl) 0 0;
  color: var(--text-secondary);
  opacity: 0.7;
  font-size: var(--font-size-body-xs);
  text-align: center;

  &:empty {
    display: none;
  }
`;

const offline = css`
  .${syncLine}& {
    order: 0;
    margin: var(--space-xs) 0 var(--space-sm);
    opacity: 1;
    text-align: left;
    color: var(--text-danger);
  }
`;

export function SyncLine() {
  const state = useSyncState();
  return (
    <p className={clsx(syncLine, state.offline && offline)} aria-live="polite">
      {syncText(state)}
    </p>
  );
}
