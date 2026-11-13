import { useState } from "react";
import { openSheet, type Finish } from "@/components/sheet/open-sheet.tsx";
import { todayIso, type StoredNote } from "@/lib/notes/model.ts";
import { InboxAbout } from "./inbox-about.tsx";
import { InboxMenu } from "./inbox-menu.tsx";
import { InboxWhen } from "./inbox-when.tsx";
import { copy } from "@/content/index.ts";

export type InboxResult =
  { kind: "sort"; into: string; when: string } | { kind: "archive" } | { kind: "open" };

export type InboxStep = "menu" | "about" | "when";

export interface InboxStepProps {
  item: StoredNote;
  finish: Finish<InboxResult>;
  show: (step: InboxStep) => void;
}

interface InboxSheetProps {
  item: StoredNote;
  start: InboxStep;
  finish: Finish<InboxResult>;
}

function InboxSheet({ item, start, finish }: InboxSheetProps) {
  const [step, setStep] = useState<InboxStep>(start);
  const [into, setInto] = useState("");
  const props = { item, finish, show: setStep };
  if (step === "about")
    return (
      <InboxAbout
        {...props}
        onPick={(path) => {
          setInto(path);
          setStep("when");
        }}
      />
    );
  if (step === "when") return <InboxWhen {...props} into={into} now={todayIso()} />;
  return <InboxMenu {...props} />;
}

export function inboxSheet(
  item: StoredNote,
  start: InboxStep = "menu",
): Promise<InboxResult | null> {
  return openSheet<InboxResult>(copy.inbox.sortTitle, (finish) => (
    <InboxSheet item={item} start={start} finish={finish} />
  ));
}
