import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarBlankIcon,
  FileTextIcon,
  HeartIcon,
  HouseIcon,
  NoteIcon,
  PackageIcon,
  SquaresFourIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { go } from "@/lib/platform/router.ts";
import { addPersonFlow, addSubjectFlow } from "@/flows/new-flow.ts";
import { copy } from "@/content/index.ts";

export type Folder = keyof typeof copy.notes.folders;

export const FOLDER_ICON: Record<Folder, PhosphorIcon> = {
  areas: SquaresFourIcon,
  projects: BriefcaseIcon,
  people: UserIcon,
  groups: UsersIcon,
  places: HouseIcon,
  things: PackageIcon,
  topics: NoteIcon,
  events: CalendarBlankIcon,
  journal: BookOpenIcon,
  resources: FileTextIcon,
  me: HeartIcon,
};

export const FOLDERS = Object.keys(FOLDER_ICON) as Folder[];

export const ADD_IN: Partial<Record<Folder, () => Promise<void>>> = {
  people: addPersonFlow,
  places: () => addSubjectFlow("Place"),
  things: () => addSubjectFlow("Thing"),
  journal: async () => go("/write"),
};

export function isFolder(name: string): name is Folder {
  return (FOLDERS as string[]).includes(name);
}
