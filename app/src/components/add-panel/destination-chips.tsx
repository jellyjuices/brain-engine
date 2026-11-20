import styles from "./destination-chips.module.css";
import { AtIcon, CheckIcon, HashIcon } from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { copy } from "@/content/index.ts";

export function DestinationChips({
  suggestions,
  picked,
  onPick,
}: {
  suggestions: Suggestion[];
  picked: string | null;
  onPick: (s: Suggestion | null) => void;
}) {
  return (
    <div className={styles.destinationChips} role="group" aria-label={copy.sort.homeList}>
      {suggestions.map((s, i) => {
        const on = picked === s.key;
        return (
          <span
            key={s.key}
            className={styles.chip}
            style={{ animationDelay: `calc(${i} * var(--motion-fast) / 2)` }}
          >
            <Chip
              label={s.title}
              variant="accent"
              icon={on ? CheckIcon : s.kind === "tag" ? HashIcon : AtIcon}
              ariaLabel={on ? copy.sort.picked(s.title) : copy.sort.sortTo(s.title)}
              onClick={() => onPick(on ? null : s)}
            />
          </span>
        );
      })}
    </div>
  );
}
