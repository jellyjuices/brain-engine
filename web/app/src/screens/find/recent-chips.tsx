import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Chip, chips } from "@/components/chip/chip.tsx";
import { recentSearches } from "@/lib/notes/recent-searches.ts";
import { Empty } from "@/components/empty/empty.tsx";
import { copy } from "@/content/index.ts";

export function RecentChips({ onPick }: { onPick: (q: string) => void }) {
  const [recent, setRecent] = useState<string[] | null>(null);
  useEffect(() => {
    void recentSearches().then(setRecent);
  }, []);
  if (!recent) return null;
  if (!recent.length) return <Empty size="sm" title={copy.notes.findHint} />;
  return (
    <>
      <p className="section-label">{copy.notes.recent}</p>
      <div className={chips}>
        {recent.map((r) => (
          <Chip key={r} icon={MagnifyingGlassIcon} onClick={() => onPick(r)}>
            {r}
          </Chip>
        ))}
      </div>
    </>
  );
}
