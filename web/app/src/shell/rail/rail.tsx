import { css } from "@linaria/core";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { main, panel } from "@/components/add-panel/add-panel.styles.ts";
import { shape } from "@/components/shape/shape.tsx";
import { MAIN_PLACES, SETTINGS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { copy } from "@/content/index.ts";

const rail = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: none;
  width: 240px;
  padding: calc(var(--space-xl) + env(safe-area-inset-top)) var(--space-md) var(--space-lg)
    calc(var(--space-md) + env(safe-area-inset-left));
  background: var(--background-secondary);
  border-right: var(--size-hair) solid var(--border-primary);
  overflow-y: auto;
  position: relative;
  z-index: 30;

  & .${panel} {
    justify-content: flex-start;
    margin-bottom: var(--space-lg);
  }

  & .${main} {
    flex-direction: row;
    gap: var(--space-md);
    font-size: var(--font-size-body-md);
    color: var(--text-primary);
  }

  & .${main} .${shape} {
    margin-top: 0;
  }
`;

const end = css`
  display: flex;
  flex-direction: column;
  margin-top: auto;
`;

export function Rail() {
  return (
    <nav className={rail} aria-label={copy.nav.main}>
      <AddPanel />
      {MAIN_PLACES.map((place) => (
        <PlaceLink key={place.href} place={place} variant="rail" />
      ))}
      <div className={end}>
        <PlaceLink place={SETTINGS} variant="rail" />
      </div>
    </nav>
  );
}
