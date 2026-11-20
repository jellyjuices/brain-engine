import { noteHref } from "@/lib/notes/model.ts";
import styles from "./subject-card.module.css";

export interface Line {
  path: string;
  title: string;
  role?: string;
  time?: string;
}

export function NoteLink({ line }: { line: Line }) {
  return (
    <p>
      <a className={styles.cardLink} href={noteHref(line.path)}>
        {line.title}
      </a>
      {line.role && <span className={styles.cardWhen}>{` · ${line.role}`}</span>}
      {line.time && <span className={styles.cardWhen}>{` · ${line.time}`}</span>}
    </p>
  );
}
