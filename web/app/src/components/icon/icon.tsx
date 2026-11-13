import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export function Icon({ icon: Glyph }: { icon: PhosphorIcon }) {
  return <Glyph aria-hidden="true" focusable="false" />;
}
