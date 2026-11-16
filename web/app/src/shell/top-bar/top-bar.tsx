import { css } from "@linaria/core";
import { frame } from "@/shell/unsorted-banner/unsorted-banner.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import { SETTINGS, TODOS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";

const topBar = css`
  display: flex;
  justify-content: flex-end;
  padding: env(safe-area-inset-top) calc(var(--space-sm) + env(safe-area-inset-right)) 0
    calc(var(--space-sm) + env(safe-area-inset-left));

  & ~ .${frame} {
    margin-top: 0;
  }
`;

export function TopBar() {
  const { name } = useRoute();
  if (!TODOS.screens.includes(name)) return null;
  return (
    <div className={topBar}>
      <PlaceLink place={SETTINGS} variant="icon" />
    </div>
  );
}
