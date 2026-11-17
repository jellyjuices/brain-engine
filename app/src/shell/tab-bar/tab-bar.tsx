import "./tab-bar.css";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { BRAIN, FIND, GOALS, TODOS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { copy } from "@/content/index.ts";

export function TabBar() {
  return (
    <nav className="tabbar" aria-label={copy.nav.main}>
      <PlaceLink place={TODOS} variant="tab" />
      <PlaceLink place={GOALS} variant="tab" />
      <AddPanel />
      <PlaceLink place={FIND} variant="tab" />
      <PlaceLink place={BRAIN} variant="tab" />
    </nav>
  );
}
