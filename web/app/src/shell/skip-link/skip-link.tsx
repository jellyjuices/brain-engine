import "./skip-link.css";
import type { MouseEvent } from "react";
import { useRoute } from "@/hooks/use-route.ts";
import { placeOf } from "@/shell/places.ts";
import { copy } from "@/content/index.ts";

export const MAIN_ID = "main";

export function SkipLink() {
  const { name } = useRoute();
  const target = placeOf(name)?.label ?? copy.nav.main;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById(MAIN_ID)?.focus();
  }

  return (
    <a className="skip-link" href={`#${MAIN_ID}`} onClick={handleClick}>
      {copy.nav.skipTo(target)}
    </a>
  );
}
