import "./find.css";
import { SubjectCard } from "@/components/card/subject-card.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { noteHref, todayIso, type StoredNote } from "@/lib/notes/model.ts";
import { rememberSearch } from "@/lib/notes/recent-searches.ts";
import type { RemoteSearch } from "@/lib/notes/server-search.ts";
import { buildCard, cardHasContent, matchSubject } from "@/lib/notes/subject-card.ts";
import { Empty } from "@/components/empty/empty.tsx";
import { AnswerRow } from "./answer-row.tsx";
import { useDeviceFind } from "./use-device-find.ts";
import { copy } from "@/content/index.ts";

export interface FindResultsProps {
  q: string;
  notes: StoredNote[];
  remote: RemoteSearch | null;
}

export function FindResults({ q, notes, remote }: FindResultsProps) {
  const found = useDeviceFind(q, notes);
  const useRemote = remote && remote.q === q ? remote : null;
  const subject = useRemote ? null : matchSubject(notes, q);
  const card = useRemote
    ? useRemote.card
    : subject
      ? buildCard(notes, subject, todayIso())
      : undefined;

  if (!found) return null;
  const others = found.notes.filter((x) => x.path !== card?.subject.path);
  const answer = found.answer;
  const answerNote = answer && found.notes.find((x) => x.path === answer.path);

  if (!card && !others.length) return <Empty size="sm" title={copy.common.nothingFound} />;
  return (
    <>
      {answer && answerNote && (
        <AnswerRow
          answer={answer}
          noteTitle={answerNote.title}
          onPick={() => void rememberSearch(q)}
        />
      )}
      {card && <SubjectCard card={card} heading bare={!cardHasContent(card) && !others.length} />}
      {others.length > 0 && (
        <>
          <p className="section-label">{card ? copy.notes.more : copy.notes.notes}</p>
          <List>
            {others.map((x) => (
              <Row
                key={x.path}
                href={noteHref(x.path)}
                title={x.title}
                end={x.type}
                sub={x.sub || undefined}
                onClick={() => void rememberSearch(q)}
              />
            ))}
          </List>
        </>
      )}
    </>
  );
}
