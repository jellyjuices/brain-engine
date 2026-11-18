import styles from "./note.module.css";
import { PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/button/button.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { IconButton } from "@/components/icon-button/icon-button.tsx";
import { SubjectCard } from "@/components/card/subject-card.tsx";
import { NoteIntro } from "@/components/facts/note-intro.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { typeLook } from "@/lib/notes/kinds.ts";
import { noteHref, todayIso } from "@/lib/notes/model.ts";
import { backlinksOf, buildCard, cardHasContent, isSubject } from "@/lib/notes/subject-card.ts";
import { back, go, navigate } from "@/lib/platform/router.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { editOrigin } from "./edit-origin.ts";
import { NoteBody } from "./note-body.tsx";
import { NoteConflict } from "./note-conflict.tsx";
import { NoteMissing } from "./note-missing.tsx";
import { useNoteStatus } from "./use-note-status.ts";
import { copy } from "@/content/index.ts";

export function NoteRead({ path }: { path: string }) {
  const notes = useNotes();
  const status = useNoteStatus(path);

  useEffect(() => {
    void syncNow();
  }, [path]);

  if (!notes || !status.loaded) return null;
  const note = notes.find((n) => n.path === path);
  if (!note) return <NoteMissing path={path} />;
  if (status.conflict) return <NoteConflict note={note} conflict={status.conflict} />;

  const card = isSubject(note) ? buildCard(notes, note, todayIso()) : undefined;
  const showCard = !!card && cardHasContent(card);
  const links = backlinksOf(notes, path);

  return (
    <>
      <PageHeader
        onBack={() => back()}
        action={
          <IconButton
            icon={PencilSimpleIcon}
            label={copy.common.edit}
            onClick={() => {
              editOrigin.fromNote = true;
              go(`${noteHref(path)}?edit=1`);
            }}
          />
        }
      />
      <NoteIntro note={note} notes={notes} />
      {status.waiting && <p className={styles.pending}>{copy.notes.editWaiting}</p>}
      {showCard && <SubjectCard card={card} />}
      <NoteBody note={note} hideOpenLoops={showCard} />
      <div className={styles.addHere}>
        <Button
          variant="outlined"
          icon={PlusIcon}
          block
          onClick={() => navigate("add", { into: path })}
        >
          {copy.add.addHere}
        </Button>
      </div>
      {links.length > 0 && (
        <section>
          <SectionHeader title={copy.notes.linkedFrom} />
          <List>
            {links.map((l) => (
              <Row
                key={l.path}
                {...typeLook(l.type)}
                href={noteHref(l.path)}
                title={l.title}
                end={l.type}
              />
            ))}
          </List>
        </section>
      )}
    </>
  );
}
