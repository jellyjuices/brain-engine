import { go } from "@/lib/platform/router.ts";
import { addPersonFlow, addSubjectFlow } from "@/flows/create-flow.ts";
import { copy } from "@/content/index.ts";

export type Folder = keyof typeof copy.notes.folders;

export const FOLDERS = Object.keys(copy.notes.folders) as Folder[];

export const ADD_IN: Partial<Record<Folder, () => Promise<void>>> = {
  people: addPersonFlow,
  places: () => addSubjectFlow("Place"),
  things: () => addSubjectFlow("Thing"),
  journal: async () => go("/journal"),
};

export function isFolder(name: string): name is Folder {
  return (FOLDERS as string[]).includes(name);
}
