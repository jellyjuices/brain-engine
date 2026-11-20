import { WhenPicker } from "@/components/when-picker/when-picker.tsx";
import { InboxSheetHeader } from "./inbox-sheet-header.tsx";
import type { InboxStepProps } from "./inbox-sheet.tsx";
import { copy } from "@/content/index.ts";

export interface InboxWhenStepProps extends InboxStepProps {
  into: string;
  now: string;
}

export function InboxWhenStep({ item, finish, show, into, now }: InboxWhenStepProps) {
  return (
    <>
      <InboxSheetHeader item={item} title={copy.inbox.when} onBack={() => show("about")} />
      <WhenPicker
        now={now}
        choices={["today", "tomorrow", "friday", "nextWeek", "someday", "waiting"]}
        onPick={(when) => finish({ kind: "sort", into, when })}
        onNotTodo={() => finish({ kind: "sort", into, when: "note" })}
      />
    </>
  );
}
