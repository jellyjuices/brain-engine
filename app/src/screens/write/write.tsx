import "./write.css";
import { FileTextIcon, UserIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { DateField } from "@/components/date-field/date-field.tsx";
import { PickField } from "@/components/field/pick-field.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { FilePicker } from "@/components/file-picker/file-picker.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { Tool } from "@/components/tool-bar/tool.tsx";
import { ToolBar } from "@/components/tool-bar/tool-bar.tsx";
import { pickAbout, readTextFile, saveJournal } from "@/flows/new-flow.ts";
import { useDraft } from "@/hooks/use-draft.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { readDraft } from "@/lib/storage/drafts.ts";
import { copy } from "@/content/index.ts";

interface WriteDraft {
  title: string;
  date: string;
  about: { path: string; title: string } | null;
  text: string;
}

function blank(): WriteDraft {
  return { title: "", date: todayIso(), about: null, text: "" };
}

export function WriteScreen() {
  const [form, setForm] = useState(blank);
  const current = useRef(form);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void readDraft<WriteDraft>("write").then((d) => {
      if (!d?.text && !d?.title) return;
      current.current = d;
      setForm(d);
    });
  }, []);

  function update(patch: Partial<WriteDraft>) {
    const next = { ...current.current, ...patch };
    current.current = next;
    setForm(next);
    saver.keep(next);
  }

  async function send() {
    const { title, text, date, about } = current.current;
    if (!text.trim()) return;
    saver.drop();
    current.current = blank();
    setForm(current.current);
    const ok = await saveJournal({
      title: title.trim(),
      text: text.trim(),
      date,
      ...(about && { about: about.path }),
    });
    if (!ok) update({ title, text, date, about });
  }

  const saver = useDraft<WriteDraft>("write", () => void send());

  return (
    <>
      <ScreenHead title={copy.nav.journal} fallback="/new" />
      <TextField
        label={copy.add.writeTitleLabel}
        hideLabel
        placeholder={copy.add.writeTitle}
        value={form.title}
        onChange={(title) => update({ title })}
      />
      <div className="write-meta">
        <DateField
          label={copy.add.day}
          value={form.date}
          onChange={(d) => update({ date: d || todayIso() })}
        />
        <PickField
          label={copy.add.about}
          icon={UserIcon}
          value={form.about?.title}
          placeholder={copy.add.aboutEmpty}
          onPick={() =>
            void pickAbout().then((n) => n && update({ about: { path: n.path, title: n.title } }))
          }
          onClear={() => update({ about: null })}
        />
      </div>
      <textarea
        className="composer"
        placeholder={copy.add.writePlaceholder}
        aria-label={copy.nav.journal}
        autoCapitalize="sentences"
        value={form.text}
        onChange={(e) => update({ text: e.target.value })}
      />
      <ToolBar label={copy.add.details}>
        <Tool icon={FileTextIcon} label={copy.add.file} onClick={() => picker.current?.click()} />
      </ToolBar>
      <FilePicker
        inputRef={picker}
        onFile={(file) =>
          void readTextFile(file).then((t) => {
            const old = current.current.text;
            if (t) update({ text: old ? `${old}\n\n${t}` : t });
          })
        }
      />
    </>
  );
}
