import { requestAdd } from "@/components/add-panel/add-request.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { dayInText } from "@/lib/notes/when-word.ts";
import { getNote } from "@/lib/storage/store.ts";
import { queueInbox, queueUndo } from "@/lib/sync/writes.ts";
import { saveFlow, type DoneToast } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

export interface TodoAdd {
  text: string;
  tags: string[];
  into?: string;
  home: Suggestion | null;
}

async function placeName(into: string | undefined, home: Suggestion | null): Promise<string> {
  if (into) return (await getNote(into))?.title ?? home?.title ?? copy.sort.unsorted;
  return home?.title ?? copy.sort.unsorted;
}

function undo(): Promise<boolean> {
  return saveFlow(queueUndo, copy.toast.undone);
}

export async function addTodo(add: TodoAdd): Promise<boolean> {
  const into = add.into ?? (add.home?.kind === "subject" ? add.home.value : undefined);
  const tags =
    add.home?.kind === "tag" && !add.tags.includes(add.home.value)
      ? [...add.tags, add.home.value]
      : add.tags;
  const day = dayInText(add.text, todayIso());
  const done: DoneToast = {
    message: copy.sort.addedTo(await placeName(into, add.home)),
    ...(day && { detail: longDate(day) }),
    actions: [
      {
        label: copy.sort.move,
        onClick: () => void undo().then((ok) => ok && requestAdd({ text: add.text })),
      },
      { label: copy.common.undo, onClick: () => void undo() },
    ],
  };
  return saveFlow(() => queueInbox(add.text, into, tags), done);
}
