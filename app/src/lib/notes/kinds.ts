import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarBlankIcon,
  ChatCircleDotsIcon,
  CheckSquareIcon,
  DotsThreeIcon,
  FileTextIcon,
  HeartIcon,
  HouseIcon,
  LightbulbIcon,
  NoteIcon,
  PackageIcon,
  ScalesIcon,
  SquaresFourIcon,
  TargetIcon,
  TrayIcon,
  UserIcon,
  UsersIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const KIND_ICON = {
  todo: CheckSquareIcon,
  journal: BookOpenIcon,
  person: UserIcon,
  place: HouseIcon,
  thing: PackageIcon,
  file: FileTextIcon,
  intake: ChatCircleDotsIcon,
  other: DotsThreeIcon,
  area: SquaresFourIcon,
  project: BriefcaseIcon,
  group: UsersIcon,
  topic: LightbulbIcon,
  event: CalendarBlankIcon,
  note: NoteIcon,
  goal: TargetIcon,
  decision: ScalesIcon,
  capture: TrayIcon,
  lens: HeartIcon,
} as const satisfies Record<string, PhosphorIcon>;

export type KindName = keyof typeof KIND_ICON;

const TYPE_KIND: Record<string, KindName> = {
  Area: "area",
  Project: "project",
  Person: "person",
  Group: "group",
  Place: "place",
  Thing: "thing",
  Topic: "topic",
  Event: "event",
  Note: "note",
  Journal: "journal",
  Goal: "goal",
  Decision: "decision",
  Capture: "capture",
  Lens: "lens",
};

const FOLDER_KIND: Record<string, KindName> = {
  areas: "area",
  projects: "project",
  people: "person",
  groups: "group",
  places: "place",
  things: "thing",
  topics: "topic",
  events: "event",
  journal: "journal",
  resources: "note",
  me: "lens",
};

export interface KindLook {
  shape: KindName;
  icon: PhosphorIcon;
}

export function kindLook(kind: KindName): KindLook {
  return { shape: kind, icon: KIND_ICON[kind] };
}

export function folderLook(folder: string): KindLook {
  return kindLook(FOLDER_KIND[folder] ?? "note");
}

export function typeLook(type: string | undefined): KindLook {
  return kindLook(TYPE_KIND[type ?? ""] ?? "note");
}
