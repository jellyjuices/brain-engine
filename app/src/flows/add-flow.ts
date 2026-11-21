import type { Suggestion } from "@/lib/notes/mention.ts";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { dayInText } from "@/lib/notes/when-word.ts";
import { navigate } from "@/lib/platform/router.ts";
import { queueInbox } from "@/lib/sync/writes.ts";
import { saveFlow, type DoneToast } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

export interface TodoAdd {
  text: string;
  tags: string[];
  into?: string;
  home: Suggestion | null;
}

export async function addTodo(add: TodoAdd): Promise<boolean> {
  const into = add.into ?? (add.home?.kind === "subject" ? add.home.value : undefined);
  const tags =
    add.home?.kind === "tag" && !add.tags.includes(add.home.value)
      ? [...add.tags, add.home.value]
      : add.tags;
  const day = dayInText(add.text, todayIso());
  const done: DoneToast = {
    message: copy.sort.addedTo(copy.sort.unsorted),
    ...(day && { detail: longDate(day) }),
    actions: [{ label: copy.sort.move, onClick: () => navigate("inbox") }],
  };
  return saveFlow(() => queueInbox(add.text, into, tags), done);
}
