import styles from "./facts.module.css";
import { Chip } from "@/components/chip/chip.tsx";
import { sentence } from "@/lib/notes/facts.ts";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import type { IntroNames } from "@/lib/notes/note-intro.ts";
import { copy } from "@/content/index.ts";

export function NoteHeader({ note, names }: { note: StoredNote; names: IntroNames }) {
  const { title, nick, pronouns } = names;
  const showDesc = note.description && note.description.trim() !== title.trim();
  const area = note.type !== "Capture" ? note.area : undefined;
  return (
    <>
      {note.type !== "Capture" && (
        <p className={styles.kicker}>
          {note.type ?? copy.common.note}
          {area && (
            <>
              {" · "}
              <a className={styles.factLink} href={noteHref(`areas/${area}.md`)}>
                {sentence(area.replace(/-/g, " "))}
              </a>
            </>
          )}
        </p>
      )}
      <h1 className={styles.noteTitle}>{title}</h1>
      {(nick || pronouns) && (
        <p className={styles.noteWho}>
          {nick && <span className={styles.noteNick}>{nick}</span>}
          {pronouns && <Chip label={pronouns} />}
        </p>
      )}
      {showDesc && <p className={styles.noteDesc}>{note.description}</p>}
    </>
  );
}
