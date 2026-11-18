import { List } from "@/components/row/list.tsx";
import { Shape } from "@/components/shape/shape.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import { Panel } from "@/components/panel/panel.tsx";
import styles from "./card.module.css";
import { CardSection } from "./card-section.tsx";
import { CardTodoRow } from "./card-todo-row.tsx";
import { LinkLine, type Line } from "./link-line.tsx";
import { longDate, noteHref, todayIso } from "@/lib/notes/model.ts";
import type { Card } from "@/lib/notes/card-types.ts";
import { copy } from "@/content/index.ts";

export interface SubjectCardProps {
  card: Card;
  heading?: boolean;
  bare?: boolean;
}

export function SubjectCard({ card, heading, bare }: SubjectCardProps) {
  const { subject } = card;
  const out = card.relations.filter((r) => r.direction === "out");
  const headings = [...new Set(out.map((r) => r.heading))];
  const seen = new Set<string>();
  const related: Line[] = [
    ...card.relations.filter((r) => r.direction === "in"),
    ...card.related.map((r) => ({ path: r.path, title: r.title })),
  ].filter((r) => !seen.has(r.path) && seen.add(r.path));

  if (bare) return null;
  return (
    <Panel label={copy.notes.subjectLabel(subject.title)}>
      {heading && (
        <>
          <a className={styles.cardHead} href={noteHref(subject.path)}>
            <Shape name={typeLook(subject.type).shape} icon={typeLook(subject.type).icon} />
            <span className={styles.cardTitle}>{subject.title}</span>
            <span className={styles.cardType}>{subject.type ?? copy.common.note}</span>
          </a>
          {subject.description && <p className={styles.cardDesc}>{subject.description}</p>}
        </>
      )}
      {card.todo.length > 0 && (
        <CardSection label={copy.todo.toDo}>
          <List variant="ghost">
            {card.todo.map((t) => (
              <CardTodoRow key={t.ref ?? `${t.path}:${t.text}`} todo={t} subject={subject.title} />
            ))}
          </List>
        </CardSection>
      )}
      {card.next && (
        <CardSection label={copy.notes.next}>
          <p>
            <a className={styles.cardLink} href={noteHref(card.next.path)}>
              {card.next.text}
            </a>
            <span className={styles.cardWhen}>
              {` · ${card.next.date === todayIso() ? copy.common.today : longDate(card.next.date)}`}
            </span>
          </p>
        </CardSection>
      )}
      {card.history.length > 0 && (
        <CardSection label={copy.notes.lately}>
          {card.history.map((l, i) => (
            <p key={i}>
              <span className={styles.cardWhen}>{`${longDate(l.date)} · `}</span>
              {l.text}
            </p>
          ))}
        </CardSection>
      )}
      {headings.map((h) => (
        <CardSection key={h} label={h}>
          {out
            .filter((r) => r.heading === h)
            .map((r) => (
              <LinkLine key={r.path} line={r} />
            ))}
        </CardSection>
      ))}
      {related.length > 0 && (
        <CardSection label={copy.notes.related}>
          {related.map((r) => (
            <LinkLine key={r.path} line={{ path: r.path, title: r.title, role: r.role }} />
          ))}
        </CardSection>
      )}
    </Panel>
  );
}
