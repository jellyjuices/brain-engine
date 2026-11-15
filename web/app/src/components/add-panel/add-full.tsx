import { css } from "@linaria/core";
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import { Shape } from "@/components/shape/shape.tsx";
import { copy } from "@/content/index.ts";

const addFull = css`
  position: fixed;
  top: calc(
    var(--vvt, 0) + var(--vvh, 100dvh) - var(--size-tabbar) - env(safe-area-inset-bottom) - 36px -
      var(--space-lg)
  );
  right: calc(var(--space-xl) + env(safe-area-inset-right));
  z-index: 3;
  padding: 0;
  border: 0;
  background: transparent;
`;

export function AddFull({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={addFull}
      aria-label={full ? copy.add.smaller : copy.add.fullScreen}
      aria-pressed={full}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
    >
      <Shape
        name="other"
        icon={full ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
        variant="secondary"
      />
    </button>
  );
}
