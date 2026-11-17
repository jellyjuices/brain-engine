import "./facts.css";
import {
  CakeIcon,
  CalendarBlankIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import { AddFact, Fact } from "./fact.tsx";
import { FactValue } from "./fact-value.tsx";
import { birthdayFact, daysTo, findPartner, relative, sentence, str } from "@/lib/notes/facts.ts";
import { addBirthday, addPartner } from "@/flows/person-flow.ts";
import { longDate, noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function NoteIntro({ note, notes }: { note: StoredNote; notes: StoredNote[] }) {
  const meta = note.meta ?? {};
  const nickname = str(meta.nickname);
  const pronouns = str(meta.pronouns);
  const isCapture = note.type === "Capture";
  const title = isCapture ? copy.inbox.capture : str(meta.full_name) || note.title;
  const aka = [note.title, nickname].filter(
    (n) =>
      n &&
      n.toLowerCase() !== title.toLowerCase() &&
      !title.toLowerCase().startsWith(`${n.toLowerCase()} `),
  );
  const nick = nickname ? `“${nickname}”` : aka[0] && !isCapture ? copy.common.goesBy(aka[0]) : "";
  const birthday = birthdayFact(str(meta.birthday));
  const partner = note.type === "Person" ? findPartner(note, notes) : null;
  const date = str(meta.date).slice(0, 10);
  const status = str(meta.status);
  const due = (note.due ?? str(meta.due)).slice(0, 10);
  const withList = (Array.isArray(meta.with) ? meta.with : [meta.with]).map(str).filter(Boolean);
  const hasDate = ISO_DAY.test(date);
  const hasDue = !date && ISO_DAY.test(due);
  const isPerson = note.type === "Person";
  const hasFacts = isPerson || birthday || partner || hasDate || hasDue || withList.length > 0;

  return (
    <div className="note-intro">
      {!isCapture && (
        <p className="section-label">
          {note.type ?? copy.common.note}
          {note.area && (
            <>
              {" · "}
              <a className="fact-link" href={noteHref(`areas/${note.area}.md`)}>
                {sentence(note.area.replace(/-/g, " "))}
              </a>
            </>
          )}
        </p>
      )}
      <h1 className="serif note-title">{title}</h1>
      {(nick || pronouns) && (
        <p className="note-who">
          {nick && <span className="note-nick">{nick}</span>}
          {pronouns && <Chip label={pronouns} />}
        </p>
      )}
      {note.description && note.description.trim() !== title.trim() && (
        <p className="note-desc">{note.description}</p>
      )}
      {hasFacts && (
        <dl className="facts">
          {birthday && (
            <Fact icon={CakeIcon} label={copy.notes.birthday} sub={birthday.sub}>
              {birthday.main}
            </Fact>
          )}
          {isPerson && !birthday && (
            <AddFact
              icon={CakeIcon}
              label={copy.notes.birthday}
              onClick={() => void addBirthday(note)}
            />
          )}
          {partner && (
            <Fact icon={HeartIcon} label={sentence(partner.role)}>
              {partner.path ? (
                <a className="fact-link" href={noteHref(partner.path)}>
                  {partner.name}
                </a>
              ) : (
                partner.name
              )}
            </Fact>
          )}
          {isPerson && !partner && (
            <AddFact
              icon={HeartIcon}
              label={copy.notes.partner}
              onClick={() => void addPartner(note)}
            />
          )}
          {hasDate && (
            <Fact
              icon={CalendarBlankIcon}
              label={copy.notes.when}
              sub={
                status && status !== "upcoming"
                  ? sentence(status)
                  : sentence(relative(daysTo(date)))
              }
            >
              {longDate(date)}
            </Fact>
          )}
          {hasDue && (
            <Fact icon={ClockIcon} label={copy.notes.due} sub={sentence(relative(daysTo(due)))}>
              {longDate(due)}
            </Fact>
          )}
          {withList.length > 0 && (
            <Fact icon={UsersIcon} label={copy.notes.with}>
              <span>
                {withList.map((w, i) => (
                  <span key={w}>
                    {i > 0 && ", "}
                    <FactValue from={note.path} value={w} />
                  </span>
                ))}
              </span>
            </Fact>
          )}
        </dl>
      )}
    </div>
  );
}
