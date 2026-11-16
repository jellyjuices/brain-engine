import { css } from "@linaria/core";
import type { MouseEvent } from "react";
import { useRoute } from "@/hooks/use-route.ts";
import { placeOf } from "@/shell/places.ts";
import { copy } from "@/content/index.ts";

export const MAIN_ID = "main";

const skipLink = css`
  position: fixed;
  top: calc(var(--space-sm) + env(safe-area-inset-top));
  left: calc(var(--space-sm) + env(safe-area-inset-left));
  z-index: 40;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--background-accent);
  color: var(--text-on-accent);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  translate: 0 calc(-100% - var(--space-2xl));

  &:focus {
    translate: 0 0;
  }
`;

export function SkipLink() {
  const { name } = useRoute();
  const target = placeOf(name)?.label ?? copy.nav.main;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById(MAIN_ID)?.focus();
  }

  return (
    <a className={skipLink} href={`#${MAIN_ID}`} onClick={handleClick}>
      {copy.nav.skipTo(target)}
    </a>
  );
}
