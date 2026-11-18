import styles from "./view-tabs.module.css";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";
import { usePill } from "./use-pill.ts";

export type View = { value: string; label: string; disabled?: boolean };

export type ViewTabsProps = {
  views: View[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  renderPanel?: (value: string) => ReactNode;
};

export const ViewTabs = ({ views, value, onValueChange, label, renderPanel }: ViewTabsProps) => {
  const { list: listRef, box } = usePill(value);
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} activationMode="manual">
      <Tabs.List ref={listRef} className={styles.list} aria-label={label}>
        <span
          className={styles.pill}
          aria-hidden
          style={{
            transform: `translateX(${box.x}px)`,
            width: box.width,
            opacity: box.width ? 1 : 0,
          }}
        />
        {views.map((view) => (
          <Tabs.Trigger
            key={view.value}
            value={view.value}
            disabled={view.disabled}
            className={styles.trigger}
          >
            {view.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {renderPanel &&
        views.map((view) => (
          <Tabs.Content key={view.value} value={view.value} className={styles.panel}>
            {renderPanel(view.value)}
          </Tabs.Content>
        ))}
    </Tabs.Root>
  );
};
