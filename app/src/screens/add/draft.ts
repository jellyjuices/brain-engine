import { readDraft } from "@/lib/storage/drafts.ts";

export interface Draft {
  text: string;
  tags: string[];
}

export const draft: Draft = { text: "", tags: [] };

export async function restoreDraft(): Promise<boolean> {
  if (draft.text) return false;
  const saved = await readDraft<Draft>("add");
  if (!saved?.text) return false;
  draft.text = saved.text;
  draft.tags = saved.tags;
  return true;
}
