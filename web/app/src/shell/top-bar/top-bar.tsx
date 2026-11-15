import "./top-bar.css";
import { useRoute } from "@/hooks/use-route.ts";
import { SETTINGS, TODOS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";

export function TopBar() {
  const { name } = useRoute();
  if (!TODOS.screens.includes(name)) return null;
  return (
    <div className="top-bar">
      <PlaceLink place={SETTINGS} variant="icon" />
    </div>
  );
}
