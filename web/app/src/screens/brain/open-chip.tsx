import { Chip } from "@/components/chip/chip.tsx";
import { copy } from "@/content/index.ts";

export function OpenChip({ open }: { open: number }) {
  if (open <= 0) return null;
  return (
    <Chip size="sm" label={copy.common.openTodos(open)}>
      {open}
    </Chip>
  );
}
