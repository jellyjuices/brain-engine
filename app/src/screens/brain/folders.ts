import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export type Folder = keyof typeof copy.notes.folders;

export const FOLDERS = Object.keys(copy.notes.folders) as Folder[];

export const ADD_IN: Partial<Record<Folder, () => Promise<void>>> = {
  people: async () => go("/build/person"),
  places: async () => go("/build/place"),
  things: async () => go("/build/thing"),
  journal: async () => go("/journal"),
};

export function isFolder(name: string): name is Folder {
  return (FOLDERS as string[]).includes(name);
}
