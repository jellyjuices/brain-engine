import { KindIcon } from "@/components/kind-icon/kind-icon.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import { Panel } from "@/components/panel/panel.tsx";
import styles from "./subject-card.module.css";
import { SubjectCardSection } from "./subject-card-section.tsx";
import { UpcomingItem } from "./upcoming-item.tsx";
import { NoteLink, type Line } from "./note-link.tsx";
import { longDate, noteHref } from "@/lib/notes/model.ts";
import { soonOf } from "@/lib/notes/card-soon.ts";
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
  const soon = soonOf(card);

  if (bare) return null;
  return (
    <Panel label={copy.notes.subjectLabel(subject.title)}>
      {heading && (
        <>
          <a className={styles.cardHead} href={noteHref(subject.path)}>
            <KindIcon name={typeLook(subject.type).shape} icon={typeLook(subject.type).icon} />
            <span className={styles.cardTitle}>{subject.title}</span>
            <span className={styles.cardType}>{subject.type ?? copy.common.note}</span>
          </a>
          {subject.description && <p className={styles.cardDesc}>{subject.description}</p>}
        </>
      )}
      {soon && (
        <SubjectCardSection label={copy.notes.soon}>
          <UpcomingItem soon={soon} subject={subject.title} />
        </SubjectCardSection>
      )}
      {card.history.length > 0 && (
        <SubjectCardSection label={copy.notes.lately}>
          {card.history.map((l, i) => (
            <p key={i}>
              <span className={styles.cardWhen}>{`${longDate(l.date)} · `}</span>
              {l.text}
            </p>
          ))}
        </SubjectCardSection>
      )}
      {headings.map((h) => (
        <SubjectCardSection key={h} label={h}>
          {out
            .filter((r) => r.heading === h)
            .map((r) => (
              <NoteLink key={r.path} line={r} />
            ))}
        </SubjectCardSection>
      ))}
      {related.length > 0 && (
        <SubjectCardSection label={copy.notes.related}>
          {related.map((r) => (
            <NoteLink key={r.path} line={{ path: r.path, title: r.title, role: r.role }} />
          ))}
        </SubjectCardSection>
      )}
    </Panel>
  );
}
