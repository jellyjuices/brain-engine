import { WhenPicker } from "@/components/when-picker/when-picker.tsx";
import { InboxHead } from "./inbox-head.tsx";
import type { InboxStepProps } from "./inbox-sheet.tsx";
import { copy } from "@/content/index.ts";

export interface InboxWhenProps extends InboxStepProps {
  into: string;
  now: string;
}

export function InboxWhen({ item, finish, show, into, now }: InboxWhenProps) {
  return (
    <>
      <InboxHead item={item} title={copy.inbox.when} onBack={() => show("about")} />
      <WhenPicker
        now={now}
        choices={["today", "tomorrow", "friday", "nextWeek", "someday", "waiting"]}
        onPick={(when) => finish({ kind: "sort", into, when })}
        onNotTodo={() => finish({ kind: "sort", into, when: "note" })}
      />
    </>
  );
}
