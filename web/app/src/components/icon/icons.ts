import {
  BriefcaseIcon,
  CalendarBlankIcon,
  HouseIcon,
  NoteIcon,
  PackageIcon,
  SquaresFourIcon,
  UserIcon,
  UsersIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const TYPE_ICON: Record<string, PhosphorIcon> = {
  Area: SquaresFourIcon,
  Event: CalendarBlankIcon,
  Group: UsersIcon,
  Person: UserIcon,
  Place: HouseIcon,
  Project: BriefcaseIcon,
  Thing: PackageIcon,
};

export function typeIcon(type: string | undefined): PhosphorIcon {
  return TYPE_ICON[type ?? ""] ?? NoteIcon;
}
