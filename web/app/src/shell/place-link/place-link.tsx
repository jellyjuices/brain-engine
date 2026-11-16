import "./place-link.css";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import type { Place } from "@/shell/places.ts";

export interface PlaceLinkProps {
  place: Place;
  variant: "tab" | "rail" | "icon";
}

export function PlaceLink({ place, variant }: PlaceLinkProps) {
  const { name } = useRoute();
  const iconOnly = variant === "icon";
  return (
    <a
      className={clsx("place-link", `place-link--${variant}`)}
      href={place.href}
      aria-current={place.screens.includes(name) ? "page" : undefined}
      aria-label={iconOnly ? place.label : undefined}
    >
      <Icon icon={place.icon} />
      {!iconOnly && <span>{place.label}</span>}
    </a>
  );
}
