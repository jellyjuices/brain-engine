import styles from "./rail.module.css";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { MAIN_PLACES, SETTINGS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { copy } from "@/content/index.ts";

export function Rail() {
  return (
    <nav className={styles.rail} aria-label={copy.nav.main}>
      <AddPanel layout="rail" />
      {MAIN_PLACES.map((place) => (
        <PlaceLink key={place.href} place={place} variant="rail" />
      ))}
      <div className={styles.end}>
        <PlaceLink place={SETTINGS} variant="rail" />
      </div>
    </nav>
  );
}
