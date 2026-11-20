import styles from "./note.module.css";
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { fileOpening, fileText } from "@/lib/notes/file-results.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export function FileBody({ note }: { note: StoredNote }) {
  const [whole, setWhole] = useState(false);
  const text = fileText(note);
  const { opening, more } = fileOpening(text);
  return (
    <div>
      <Markdown src={whole ? text : opening} path={note.path} />
      {more && (
        <div className={styles.addHere}>
          <Button
            variant="outlined"
            icon={whole ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
            block
            onClick={() => setWhole(!whole)}
          >
            {whole ? copy.sort.readLess : copy.sort.readWhole}
          </Button>
        </div>
      )}
    </div>
  );
}
