import "./lock.css";
import { EyeIcon, EyeSlashIcon, FingerprintIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { Button } from "@/components/button/button.tsx";
import { IconButton } from "@/components/icon-button/icon-button.tsx";
import { isEnrolled, verify } from "@/lib/lock/fingerprint.ts";
import { isSessionLapsed, writeUnlocked } from "@/lib/lock/session.ts";
import { unlock } from "@/lib/lock/unlock.ts";
import { copy } from "@/content/index.ts";

const LAPSED_MESSAGE = copy.lock.sessionEnded;

interface Message {
  text: string;
  info?: boolean;
}

export function LockScreen() {
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLFormElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(() =>
    isSessionLapsed() ? { text: LAPSED_MESSAGE, info: true } : { text: "" },
  );
  const fingerHidden = !isEnrolled() || isSessionLapsed();

  function shake() {
    const el = panel.current;
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  async function tryFingerprint(auto = false) {
    const failure = await verify();
    if (failure === null) return writeUnlocked();
    if (auto && failure === copy.lock.fpCancelled) return input.current?.focus();
    setMessage({ text: failure });
  }

  useEffect(() => {
    if (isEnrolled() && !isSessionLapsed()) void tryFingerprint(true);
    else input.current?.focus();
    const field = input.current;
    return () => {
      if (field) field.value = "";
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const field = input.current;
    if (busy || !field?.value) return;
    setBusy(true);
    setMessage({ text: "" });
    const password = field.value;
    try {
      const result = await unlock(password);
      field.value = "";
      if (result.ok) return;
      setMessage({ text: result.message });
      if (result.wrong) {
        field.focus();
        shake();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-label={copy.lock.dialog}>
      <form ref={panel} className="lock-panel" noValidate onSubmit={(e) => void onSubmit(e)}>
        <h1 className="wordmark serif">brain</h1>
        <div className="field">
          <input
            ref={input}
            id="unlock-password"
            name="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder={copy.lock.password}
            aria-label={copy.lock.password}
          />
          <IconButton
            icon={revealed ? EyeSlashIcon : EyeIcon}
            label={revealed ? copy.lock.hidePassword : copy.lock.showPassword}
            pressed={revealed}
            onClick={() => {
              setRevealed(!revealed);
              input.current?.focus();
            }}
          />
        </div>
        <p className={clsx("lock-error", message.info && "info")} role="alert">
          {message.text}
        </p>
        <Button type="submit" block disabled={busy}>
          {busy ? copy.lock.checking : copy.lock.unlock}
        </Button>
        <Button
          variant="outlined"
          block
          icon={FingerprintIcon}
          hidden={fingerHidden}
          onClick={() => void tryFingerprint()}
        >
          {copy.lock.useFingerprint}
        </Button>
      </form>
    </div>
  );
}
