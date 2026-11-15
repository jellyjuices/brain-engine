import { css } from "@linaria/core";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { modeJournal, modeTodo } from "@/components/add-panel/add-panel.styles.ts";
import { BRAIN, FIND, GOALS, TODOS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { copy } from "@/content/index.ts";

const tabbar = css`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  background: var(--background-secondary);
  border-top: var(--size-hair) solid var(--border-primary);
  padding: var(--space-xs) calc(var(--space-sm) + env(safe-area-inset-right))
    calc(var(--space-xs) + env(safe-area-inset-bottom)) calc(var(--space-sm) + env(safe-area-inset-left));
  min-height: calc(var(--size-tabbar) + env(safe-area-inset-bottom));
  position: relative;
  z-index: 30;

  .shell--popover & {
    min-height: var(--size-control);
    padding: 0 var(--space-sm);
  }

  [data-keyboard] &:not(:has(.${modeTodo}, .${modeJournal})) {
    display: none;
  }
`;

export function TabBar() {
  return (
    <nav className={tabbar} aria-label={copy.nav.main}>
      <PlaceLink place={TODOS} variant="tab" />
      <PlaceLink place={GOALS} variant="tab" />
      <AddPanel />
      <PlaceLink place={FIND} variant="tab" />
      <PlaceLink place={BRAIN} variant="tab" />
    </nav>
  );
}
