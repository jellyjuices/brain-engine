import { Button, type ButtonVariant } from "@/components/button/button.tsx";
import { openSheet } from "./open-sheet.tsx";
import { SheetActions } from "./sheet-actions.tsx";
import { SheetHead } from "./sheet-head.tsx";

export interface SheetAction {
  id: string;
  label: string;
  variant?: ButtonVariant;
}

export function confirmSheet(
  title: string,
  body: string,
  actions: SheetAction[],
): Promise<string | null> {
  return openSheet<string>(title, (finish) => (
    <>
      <SheetHead title={title} />
      <p className="lede">{body}</p>
      <SheetActions>
        {actions.map((a, i) => (
          <Button key={a.id} variant={a.variant} autoFocus={i === 0} onClick={() => finish(a.id)}>
            {a.label}
          </Button>
        ))}
      </SheetActions>
    </>
  ));
}
