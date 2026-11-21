import styles from "./note.module.css";
import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { TodoRefRow } from "@/components/todo-row/todo-ref-row.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import {
  fileAsks,
  fileNotes,
  fileTodos,
  intakeQuestions,
  type FileAsk,
} from "@/lib/notes/file-results.ts";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import { go } from "@/lib/platform/router.ts";
import { FileSection } from "./file-section.tsx";
import { copy } from "@/content/index.ts";

export function FileResults({ note, notes }: { note: StoredNote; notes: StoredNote[] }) {
  const asks = new Set<FileAsk>(fileAsks(note));
  const todos = fileTodos(notes, note);
  const added = fileNotes(notes, note);
  const questions = intakeQuestions(note);
  const none = <p className={styles.pending}>{copy.sort.noneFound}</p>;
  return (
    <>
      {(asks.has("split") || todos.length > 0) && (
        <FileSection
          title={copy.sort.todosFound}
          count={todos.length}
          busy={asks.has("split") && copy.sort.findingTodos}
        >
          {todos.length === 0 ? (
            none
          ) : (
            <List variant="plain">
              {todos.map((t) => (
                <TodoRefRow
                  key={`${t.note.path}::${t.text}`}
                  todo={makeTodo({
                    text: t.text,
                    due: t.due,
                    every: t.every,
                    path: t.note.path,
                    subject: t.note.title,
                  })}
                  surface="primary"
                />
              ))}
            </List>
          )}
        </FileSection>
      )}
      {(asks.has("enrich") || added.length > 0) && (
        <FileSection
          title={copy.sort.notesAdded}
          count={added.length}
          busy={asks.has("enrich") && copy.sort.addingNotes}
        >
          {added.length === 0 ? (
            none
          ) : (
            <List>
              {added.map(({ note: n, lines }) => (
                <ListRow
                  key={n.path}
                  {...typeLook(n.type)}
                  title={n.title}
                  sub={copy.sort.newNotes(lines)}
                  href={noteHref(n.path)}
                  chevron
                />
              ))}
            </List>
          )}
        </FileSection>
      )}
      {(asks.has("intake") || questions.length > 0) && (
        <FileSection
          title={copy.sort.intake}
          busy={asks.has("intake") && copy.sort.writingQuestions}
        >
          <List>
            <ListRow
              icon={ChatCircleDotsIcon}
              title={copy.sort.questionsReady(questions.length)}
              sub={copy.sort.oneAtATime}
            />
          </List>
          <div className={styles.addHere}>
            <Button block disabled={questions.length === 0} onClick={() => go("/intake")}>
              {copy.sort.startIntake}
            </Button>
          </div>
        </FileSection>
      )}
    </>
  );
}
