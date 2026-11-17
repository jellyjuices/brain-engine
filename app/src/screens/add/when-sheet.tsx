import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { WhenPicker } from "@/components/when-picker/when-picker.tsx";
import { copy } from "@/content/index.ts";

export function whenSheet(now: string): Promise<string | null> {
  return openSheet<string>(copy.add.whenTitle, (finish) => (
    <>
      <SheetHead title={copy.add.whenTitle} />
      <WhenPicker
        now={now}
        choices={["today", "tomorrow", "friday", "nextWeek", "someday", "waiting"]}
        onPick={finish}
        onNotTodo={() => finish("note")}
        onClear={() => finish("")}
      />
    </>
  ));
}
