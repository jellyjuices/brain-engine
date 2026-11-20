import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Chips } from "@/components/chip/chips.tsx";
import { Chip } from "@/components/chip/chip.tsx";
import { recentSearches } from "@/lib/notes/recent-searches.ts";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { copy } from "@/content/index.ts";

export function RecentChips({ onPick }: { onPick: (q: string) => void }) {
  const [recent, setRecent] = useState<string[] | null>(null);
  useEffect(() => {
    void recentSearches().then(setRecent);
  }, []);
  if (!recent) return null;
  if (!recent.length) return <EmptyState size="sm" title={copy.notes.findHint} />;
  return (
    <>
      <SectionHeader title={copy.notes.recent} />
      <Chips>
        {recent.map((r) => (
          <Chip key={r} icon={MagnifyingGlassIcon} label={r} onClick={() => onPick(r)} />
        ))}
      </Chips>
    </>
  );
}
