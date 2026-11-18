import styles from "./unsorted-banner.module.css";
import { Banner } from "@/components/banner/banner.tsx";
import { navigate } from "@/lib/platform/router.ts";
import { SORT_SCREEN } from "@/shell/places.ts";
import { useUnsortedCount } from "./use-unsorted-count.ts";
import { copy } from "@/content/index.ts";

export function UnsortedBanner() {
  const count = useUnsortedCount();
  if (count === 0) return null;
  return (
    <div className={styles.unsortedBanner}>
      <Banner
        message={copy.nav.toSort(count)}
        actionLabel={copy.nav.sort}
        onAction={() => navigate(SORT_SCREEN)}
      />
    </div>
  );
}
