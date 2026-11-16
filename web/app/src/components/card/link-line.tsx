import { cardLink, cardWhen } from "./card.styles.ts";
import { noteHref } from "@/lib/notes/model.ts";

export interface Line {
  path: string;
  title: string;
  role?: string;
  time?: string;
}

export function LinkLine({ line }: { line: Line }) {
  return (
    <p>
      <a className={cardLink} href={noteHref(line.path)}>
        {line.title}
      </a>
      {line.role && <span className={cardWhen}>{` · ${line.role}`}</span>}
      {line.time && <span className={cardWhen}>{` · ${line.time}`}</span>}
    </p>
  );
}
