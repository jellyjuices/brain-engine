import "./card.css";
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
      <a className="card-link" href={noteHref(line.path)}>
        {line.title}
      </a>
      {line.role && <span className="card-when">{` · ${line.role}`}</span>}
      {line.time && <span className="card-when">{` · ${line.time}`}</span>}
    </p>
  );
}
