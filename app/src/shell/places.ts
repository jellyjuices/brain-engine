import {
  CheckSquareIcon,
  FilesIcon,
  GearIcon,
  MagnifyingGlassIcon,
  TargetIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { HOME, type ScreenName } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export interface Place {
  label: string;
  icon: PhosphorIcon;
  href: string;
  screens: readonly ScreenName[];
}

export const TODOS: Place = {
  label: copy.nav.todos,
  icon: CheckSquareIcon,
  href: HOME,
  screens: ["todos", "today", "inbox"],
};

export const GOALS: Place = {
  label: copy.nav.goals,
  icon: TargetIcon,
  href: "/goals",
  screens: ["goals", "goal", "goal-todos"],
};

export const FIND: Place = {
  label: copy.nav.find,
  icon: MagnifyingGlassIcon,
  href: "/find",
  screens: ["find"],
};

export const BRAIN: Place = {
  label: copy.nav.brain,
  icon: FilesIcon,
  href: "/brain",
  screens: ["brain", "note"],
};

export const SETTINGS: Place = {
  label: copy.nav.settings,
  icon: GearIcon,
  href: "/settings",
  screens: ["settings"],
};

export const MAIN_PLACES = [TODOS, GOALS, FIND, BRAIN] as const;

export const SORT_SCREEN: ScreenName = "inbox";

export function placeOf(screen: ScreenName): Place | undefined {
  return [...MAIN_PLACES, SETTINGS].find((place) => place.screens.includes(screen));
}
