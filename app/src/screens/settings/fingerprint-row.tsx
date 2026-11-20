import styles from "./fingerprint-row.module.css";
import { useEffect, useState } from "react";
import { ListRow } from "@/components/list/list-row.tsx";
import { confirmSheet } from "@/components/sheet/confirm-sheet.tsx";
import { toast } from "@/components/toast/toast-store.ts";
import { enroll, forget, isEnrolled, isSupported } from "@/lib/lock/fingerprint.ts";
import { copy } from "@/content/index.ts";

export function FingerprintRow() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(isEnrolled);

  useEffect(() => {
    void isSupported().then(setSupported);
  }, []);

  async function toggle() {
    if (isEnrolled()) {
      const choice = await confirmSheet(
        copy.settings.fingerprintOffTitle,
        copy.settings.fingerprintOffBody,
        [
          { id: "off", label: copy.settings.turnOff, variant: "danger" },
          { id: "keep", label: copy.settings.keepOn, variant: "outlined" },
        ],
      );
      if (choice === "off") await forget();
    } else {
      const failure = await enroll();
      if (failure) toast(failure, { tone: "error" });
      else toast(copy.settings.fingerprintOn);
    }
    setOn(isEnrolled());
  }

  return (
    <ListRow
      hidden={!supported}
      title={<span id="fp-label">{copy.settings.fingerprint}</span>}
      sub={copy.settings.fingerprintHint}
      end={
        <button
          className={styles.switch}
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="fp-label"
          onClick={() => void toggle()}
        />
      }
    />
  );
}
