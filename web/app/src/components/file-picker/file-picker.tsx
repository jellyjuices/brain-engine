import type { Ref } from "react";
import { copy } from "@/content/index.ts";

const TEXT_FILES = ".txt,.md,.markdown,text/plain,text/markdown";

export interface FilePickerProps {
  inputRef: Ref<HTMLInputElement>;
  onFile: (file: File) => void;
}

export function FilePicker({ inputRef, onFile }: FilePickerProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={TEXT_FILES}
      aria-label={copy.common.chooseFile}
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) onFile(file);
      }}
    />
  );
}
