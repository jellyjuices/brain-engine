import { TextArea } from "@/components/field/text-area.tsx";
import styles from "./note.module.css";
import { useEffect, useRef, useState } from "react";
import { AtIcon, CalendarBlankIcon, CheckSquareIcon, HashIcon } from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import { MentionSuggestions } from "@/components/mention-suggestions/mention-suggestions.tsx";
import { useMentions } from "@/components/mention-suggestions/use-mentions.ts";
import { pickTag } from "@/components/picker-sheet/picker-sheet.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { ToolbarButton } from "@/components/toolbar/toolbar-button.tsx";
import { Toolbar } from "@/components/toolbar/toolbar.tsx";
import { useDraft } from "@/hooks/use-draft.ts";
import { insertAt, todoText, type Insertion } from "@/lib/notes/insert.ts";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { back, go } from "@/lib/platform/router.ts";
import { readDraft } from "@/lib/storage/drafts.ts";
import { getNote, putNotes } from "@/lib/storage/store.ts";
import { getConflict } from "@/lib/sync/conflict.ts";
import { queueEdit } from "@/lib/sync/writes.ts";
import { saveFlow } from "@/flows/save-flow.ts";
import { editOrigin } from "./edit-origin.ts";
import { pickDate, pickReference } from "./insert-sheet.tsx";
import { copy } from "@/content/index.ts";

interface Content {
  text: string;
  tags: string[];
}

interface EditDraft extends Content {
  base: string;
}

function same(a: Content, b: Content) {
  return a.text === b.text && a.tags.join("\n") === b.tags.join("\n");
}

export function NoteEdit({ note: opened }: { note: StoredNote }) {
  const [note] = useState(opened);
  const area = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(note.body);
  const [tags, setTags] = useState(note.tags);
  const current = useRef<Content>({ text: note.body, tags: note.tags });
  const sent = useRef<Content>({ text: note.body, tags: note.tags });
  const base = useRef(note.hash);
  const mentions = useMentions({
    area,
    from: note.path,
    text,
    setText: (t) => update({ ...current.current, text: t }),
    tags,
    setTags: (t) => update({ ...current.current, tags: t }),
  });

  useEffect(() => {
    requestAnimationFrame(() => area.current?.focus());
    void readDraft<EditDraft>(note.path).then((d) => {
      if (!d) return;
      base.current = d.base;
      current.current = { text: d.text, tags: d.tags };
      setText(d.text);
      setTags(d.tags);
    });
  }, [note.path]);

  function update(next: Content) {
    current.current = next;
    setText(next.text);
    setTags(next.tags);
    saver.keep({ ...next, base: base.current });
  }

  async function send() {
    const next = current.current;
    saver.drop();
    if (same(next, sent.current)) return;
    sent.current = next;
    let before = note;
    const ok = await saveFlow(
      async () => {
        const fresh = (await getNote(note.path)) ?? note;
        before = fresh;
        await putNotes([{ ...fresh, body: next.text, tags: next.tags }]);
        return queueEdit(note.path, next.text, base.current, next.tags);
      },
      async () => ((await getConflict(note.path)) ? copy.toast.conflict : copy.toast.saved),
      false,
      async () => {
        await putNotes([before]);
        base.current = before.hash;
      },
    );
    if (ok) base.current = (await getNote(note.path))?.hash ?? base.current;
    else update(next);
  }

  const saver = useDraft<EditDraft>(note.path, () => void send());

  function insert(chosen: Insertion | null) {
    const field = area.current;
    const now = current.current.text;
    if (chosen) {
      const next = insertAt(
        now,
        field?.selectionStart ?? now.length,
        field?.selectionEnd ?? now.length,
        chosen,
      );
      update({ ...current.current, text: next.value });
      requestAnimationFrame(() => {
        field?.focus();
        field?.setSelectionRange(next.caret, next.caret);
      });
    } else field?.focus();
  }

  function close() {
    if (editOrigin.fromNote) back();
    else go(noteHref(note.path));
  }

  return (
    <>
      <PageHeader title={note.title} kicker={copy.common.edit} onBack={close} />
      <TextArea
        ref={area}
        aria-label={copy.notes.editNote}
        spellCheck
        autoCapitalize="sentences"
        placeholder={copy.notes.mentionHint}
        value={text}
        onChange={(e) => {
          update({ ...current.current, text: e.target.value });
          mentions.track();
        }}
        onSelect={mentions.track}
        onKeyDown={(e) => {
          if (e.key === "Escape" && mentions.suggestions.length) {
            e.preventDefault();
            mentions.dismiss();
          }
        }}
      />
      {mentions.kind && mentions.suggestions.length > 0 && (
        <MentionSuggestions
          kind={mentions.kind}
          suggestions={mentions.suggestions}
          onPick={mentions.pick}
        />
      )}
      <Toolbar
        label={copy.add.details}
        meta={
          tags.length > 0 && (
            <div className={styles.noteEditTags} aria-label={copy.notes.tagList}>
              {tags.map((t) => (
                <Chip
                  key={t}
                  label={`#${t}`}
                  removeLabel={copy.common.remove(`#${t}`)}
                  onRemove={() => update({ ...current.current, tags: tags.filter((x) => x !== t) })}
                />
              ))}
            </div>
          )
        }
      >
        <ToolbarButton
          icon={CalendarBlankIcon}
          label={copy.notes.insertDate}
          onClick={() => void pickDate().then(insert)}
        />
        <ToolbarButton
          icon={HashIcon}
          label={copy.common.tag}
          onClick={() =>
            void pickTag(tags).then((t) => t && update({ ...current.current, tags: [...tags, t] }))
          }
        />
        <ToolbarButton
          icon={AtIcon}
          label={copy.add.mention}
          onClick={() => void pickReference(note.path).then(insert)}
        />
        <ToolbarButton
          icon={CheckSquareIcon}
          label={copy.notes.insertTodo}
          onClick={() => insert(todoText())}
        />
      </Toolbar>
    </>
  );
}
