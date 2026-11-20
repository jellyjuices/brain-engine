import styles from "./facts.module.css";
import { CakeIcon, HeartIcon } from "@phosphor-icons/react";
import { AddFact, Fact } from "./fact.tsx";
import { birthdayFact, findPartner, sentence } from "@/lib/notes/facts.ts";
import { addBirthday, addPartner } from "@/flows/person-flow.ts";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

type PersonFactsProps = {
  note: StoredNote;
  birthday: ReturnType<typeof birthdayFact>;
  partner: ReturnType<typeof findPartner>;
};

export function PersonFacts({ note, birthday, partner }: PersonFactsProps) {
  const isPerson = note.type === "Person";
  return (
    <>
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
            <a className={styles.factLink} href={noteHref(partner.path)}>
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
    </>
  );
}
