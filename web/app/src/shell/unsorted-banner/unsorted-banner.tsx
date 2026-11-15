import { css } from "@linaria/core";
import { Banner } from "@ds/components/banner/banner.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import { DEFAULT_ROUTE, navigate } from "@/lib/platform/router.ts";
import { SORT_SCREEN } from "@/shell/places.ts";
import { useUnsortedCount } from "./use-unsorted-count.ts";
import { copy } from "@/content/index.ts";

export const frame = css`
  margin: calc(var(--space-lg) + env(safe-area-inset-top)) calc(var(--space-lg) + env(safe-area-inset-right))
    0 calc(var(--space-lg) + env(safe-area-inset-left));
`;

export function UnsortedBanner() {
  const route = useRoute();
  const count = useUnsortedCount(route.name === DEFAULT_ROUTE, route.key);
  if (count === 0) return null;
  return (
    <div className={frame}>
      <Banner
        message={copy.nav.toSort(count)}
        actionLabel={copy.nav.sort}
        onAction={() => navigate(SORT_SCREEN)}
      />
    </div>
  );
}
