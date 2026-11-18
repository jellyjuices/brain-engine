import { Chip } from "@/components/chip/chip.tsx";
import { copy } from "@/content/index.ts";

export function OpenChip({ open }: { open: number }) {
  if (open <= 0) return null;
  return <Chip label={String(open)} ariaLabel={copy.common.openTodos(open)} />;
}
