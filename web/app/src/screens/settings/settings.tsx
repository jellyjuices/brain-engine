import "./settings.css";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@ds/components/button/button.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { useOutboxCount } from "@/hooks/use-outbox-count.ts";
import { useOutboxItems } from "@/hooks/use-outbox-items.ts";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { flush } from "@/lib/sync/outbox.ts";
import { pendingText } from "@/lib/sync/pending-text.ts";
import { FingerprintRow } from "./fingerprint-row.tsx";
import { copy } from "@/content/index.ts";

async function updateApp() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {}
  location.reload();
}

export function SettingsScreen() {
  const waiting = useOutboxCount();
  const { offline } = useSyncState();
  const items = useOutboxItems();
  const [updating, setUpdating] = useState(false);
  return (
    <>
      <ScreenHead title={copy.settings.title} />
      <List>
        <FingerprintRow />
        {waiting > 0 && (
          <>
            <Row
              title={copy.settings.unsent}
              sub={offline ? copy.settings.unsentOffline : copy.settings.unsentHint}
              end={
                <>
                  <span>{waiting}</span>
                  <Button variant="outlined" size="sm" onClick={() => void flush()}>
                    {copy.settings.syncNow}
                  </Button>
                </>
              }
            />
            {items.map((item) => (
              <Row key={item.id} title={<span className="pending-row">{pendingText(item)}</span>} />
            ))}
          </>
        )}
      </List>
      <p className="section-label">{copy.settings.app}</p>
      <List>
        <Row
          title={copy.settings.version}
          sub={__APP_VERSION__}
          end={
            <Button
              variant="outlined"
              size="sm"
              icon={<ArrowClockwiseIcon aria-hidden />}
              disabled={updating}
              busy={updating}
              onClick={() => {
                setUpdating(true);
                void updateApp();
              }}
            >
              {copy.settings.update}
            </Button>
          }
        />
      </List>
    </>
  );
}
