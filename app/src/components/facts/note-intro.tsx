import styles from "./facts.module.css";
import { DateFacts } from "./date-facts.tsx";
import { NoteHeader } from "./note-header.tsx";
import { PersonFacts } from "./person-facts.tsx";
import { birthdayFact, findPartner, str } from "@/lib/notes/facts.ts";
import { hasDateFacts, introDates, introNames } from "@/lib/notes/note-intro.ts";
import type { StoredNote } from "@/lib/notes/model.ts";

export function NoteIntro({ note, notes }: { note: StoredNote; notes: StoredNote[] }) {
  const isPerson = note.type === "Person";
  const birthday = birthdayFact(str(note.meta?.birthday));
  const partner = isPerson ? findPartner(note, notes) : null;
  const dates = introDates(note);
  const hasFacts = isPerson || Boolean(birthday) || hasDateFacts(dates);

  return (
    <div className={styles.noteIntro}>
      <NoteHeader note={note} names={introNames(note)} />
      {hasFacts && (
        <dl className={styles.facts}>
          <PersonFacts note={note} birthday={birthday} partner={partner} />
          <DateFacts from={note.path} dates={dates} />
        </dl>
      )}
    </div>
  );
}
