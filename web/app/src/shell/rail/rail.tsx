import "./rail.css";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { MAIN_PLACES, SETTINGS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { copy } from "@/content/index.ts";

export function Rail() {
  return (
    <nav className="rail" aria-label={copy.nav.main}>
      <AddPanel />
      {MAIN_PLACES.map((place) => (
        <PlaceLink key={place.href} place={place} variant="rail" />
      ))}
      <div className="rail-end">
        <PlaceLink place={SETTINGS} variant="rail" />
      </div>
    </nav>
  );
}
