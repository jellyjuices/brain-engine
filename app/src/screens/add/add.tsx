import { Composer } from "@/components/field/composer.tsx";
import { useEffect, useRef, useState } from "react";
import { ToolBar } from "@/components/tool-bar/tool-bar.tsx";
import { MentionDrawer } from "@/components/mention-drawer/mention-drawer.tsx";
import { useMentions } from "@/components/mention-drawer/use-mentions.ts";
import { useDraft } from "@/hooks/use-draft.ts";
import { useOutboxCount } from "@/hooks/use-outbox-count.ts";
import { useRoute } from "@/hooks/use-route.ts";
import {
  insertAt,
  mentionName,
  PLACEHOLDER,
  setWhenWord,
  shareToText,
} from "@/lib/notes/capture.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { previewWhen } from "@/lib/notes/when.ts";
import { back, go } from "@/lib/platform/router.ts";
import { getNote } from "@/lib/storage/store.ts";
import { queueInbox } from "@/lib/sync/writes.ts";
import { saveFlow } from "@/flows/save-flow.ts";
import { AddHead, type Target } from "./add-head.tsx";
import { AddMeta } from "./add-meta.tsx";
import { AddTools } from "./add-tools.tsx";
import { draft, restoreDraft, type Draft } from "./draft.ts";
import { copy } from "@/content/index.ts";

export function AddScreen() {
  const { params } = useRoute();
  const input = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(draft.text);
  const latest = useRef(draft.text);
  const [tags, setTags] = useState(draft.tags);
  const [into, setInto] = useState<Target | null>(null);
  const intoRef = useRef<Target | null>(null);
  const [saving, setSaving] = useState(false);
  const waiting = useOutboxCount();
  const intoPath = params.get("into");
  const after = params.get("after");
  const mentions = useMentions({
    area: input,
    from: into?.path ?? "inbox/new.md",
    text,
    setText: change,
    tags,
    setTags: changeTags,
    insert: (s) => (s.kind === "subject" ? mentionName(s) : ""),
    finish: (s, value) => (s.kind === "date" ? setWhenWord(value, s.value) : value),
  });

  useEffect(() => {
    const shared = shareToText(params);
    if (!shared) return;
    change(draft.text ? `${draft.text}\n${shared}` : shared);
    go(intoPath ? `/add?${new URLSearchParams({ into: intoPath })}` : "/add", true);
  }, [params, intoPath]);

  useEffect(() => {
    requestAnimationFrame(() => input.current?.focus());
    void restoreDraft().then((found) => {
      if (!found) return;
      latest.current = draft.text;
      setText(draft.text);
      setTags(draft.tags);
    });
  }, []);

  function keepDraft() {
    saver.keep({ text: draft.text, tags: draft.tags });
  }

  function change(next: string) {
    draft.text = next;
    latest.current = next;
    setText(next);
    keepDraft();
  }

  function changeTags(next: string[]) {
    draft.tags = next;
    setTags(next);
    keepDraft();
  }

  function pickInto(target: Target | null) {
    intoRef.current = target;
    setInto(target);
  }

  function mention(name: string) {
    const el = input.current;
    const now = latest.current;
    const result = insertAt(now, el?.selectionStart ?? now.length, name);
    change(result.text);
    requestAnimationFrame(() => el?.setSelectionRange(result.cursor, result.cursor));
  }

  async function send(): Promise<boolean> {
    const body = latest.current.trim();
    if (!body) return true;
    const sentTags = draft.tags;
    const wentTo = intoRef.current?.path;
    change("");
    changeTags([]);
    saver.drop();
    setSaving(true);
    const ok = await saveFlow(
      () => queueInbox(body, wentTo, sentTags),
      wentTo ? copy.save.addedToNote : copy.save.saved,
    );
    setSaving(false);
    if (!ok) {
      change(body);
      changeTags(sentTags);
    }
    return ok;
  }

  async function finishAfter() {
    if (!(await send())) return;
    if (into) go(noteHref(into.path), true);
    else back();
  }

  useEffect(() => {
    if (!intoPath) return;
    pickInto({ path: intoPath, title: "" });
    void getNote(intoPath).then((n) => n && pickInto({ path: n.path, title: n.title }));
  }, [intoPath]);

  const saver = useDraft<Draft>("add", () => void send());

  const when = previewWhen(text);
  const shown =
    when && when.kind !== "inbox"
      ? when
      : into && text.trim()
        ? { kind: "note", label: copy.common.note }
        : when;

  return (
    <>
      <AddHead
        after={after}
        saving={saving}
        into={into}
        onDone={() => void finishAfter()}
        onClearInto={() => pickInto(null)}
      />
      <Composer
        ref={input}
        placeholder={PLACEHOLDER}
        aria-label={copy.add.input}
        enterKeyHint="enter"
        autoCapitalize="sentences"
        value={text}
        onChange={(e) => {
          change(e.target.value);
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
        <MentionDrawer
          kind={mentions.kind}
          suggestions={mentions.suggestions}
          onPick={mentions.pick}
        />
      )}
      <ToolBar
        label={copy.add.details}
        meta={
          <AddMeta
            shown={shown}
            tags={tags}
            waiting={waiting}
            onRemoveTag={(t) => changeTags(tags.filter((x) => x !== t))}
          />
        }
      >
        <AddTools
          tags={tags}
          onWhenWord={(word) => change(setWhenWord(latest.current, word))}
          onTag={(t) => changeTags([...tags, t])}
          onMention={mention}
          onInto={pickInto}
        />
      </ToolBar>
    </>
  );
}
