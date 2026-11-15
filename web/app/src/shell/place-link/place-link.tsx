import { css } from "@linaria/core";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import type { Place } from "@/shell/places.ts";

export const placeLink = css`
  display: flex;
  align-items: center;
  min-height: var(--size-target);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition:
    color var(--motion-fast) var(--motion-easing),
    background-color var(--motion-fast) var(--motion-easing);

  &:hover {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: var(--size-focus) solid var(--border-focus);
    outline-offset: var(--size-focus);
  }

  &[aria-current="page"] {
    color: var(--text-accent);
  }

  @media (hover: none) {
    &:hover {
      color: var(--text-secondary);
    }

    &[aria-current="page"]:hover {
      color: var(--text-accent);
    }
  }
`;

const tabLink = css`
  flex-direction: column;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  font-size: var(--font-size-body-xs);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

const railLink = css`
  gap: var(--space-md);
  padding: 0 var(--space-md);
  font-size: var(--font-size-body-md);

  &[aria-current="page"] {
    background: var(--background-accent-soft);
  }

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

const iconLink = css`
  justify-content: center;
  min-width: var(--size-target);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

const variants = { tab: tabLink, rail: railLink, icon: iconLink };

export interface PlaceLinkProps {
  place: Place;
  variant: "tab" | "rail" | "icon";
}

export function PlaceLink({ place, variant }: PlaceLinkProps) {
  const { name } = useRoute();
  const iconOnly = variant === "icon";
  return (
    <a
      className={clsx(placeLink, variants[variant])}
      href={place.href}
      aria-current={place.screens.includes(name) ? "page" : undefined}
      aria-label={iconOnly ? place.label : undefined}
    >
      <Icon icon={place.icon} />
      {!iconOnly && <span>{place.label}</span>}
    </a>
  );
}
