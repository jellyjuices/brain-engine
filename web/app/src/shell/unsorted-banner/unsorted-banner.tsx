import "./unsorted-banner.css";
import { TrayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import { DEFAULT_ROUTE, navigate } from "@/lib/platform/router.ts";
import { SORT_SCREEN } from "@/shell/places.ts";
import { useUnsortedCount } from "./use-unsorted-count.ts";
import { copy } from "@/content/index.ts";

export function UnsortedBanner() {
  const route = useRoute();
  const count = useUnsortedCount(route.name === DEFAULT_ROUTE, route.key);
  if (count === 0) return null;
  return (
    <div className="unsorted-banner" role="status">
      <Icon icon={TrayIcon} />
      <p className="unsorted-banner-message">{copy.nav.toSort(count)}</p>
      <Button variant="primary" size="sm" onClick={() => navigate(SORT_SCREEN)}>
        {copy.nav.sort}
      </Button>
    </div>
  );
}
