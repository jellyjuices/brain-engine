import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { typeLook } from "@/lib/notes/kinds.ts";

export function typeIcon(type: string | undefined): PhosphorIcon {
  return typeLook(type).icon;
}
