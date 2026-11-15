import { css } from "@linaria/core";
import { EyeIcon, EyeSlashIcon, FingerprintIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { Button } from "@ds/components/button/button.tsx";
import { IconButton } from "@ds/components/icon-button/icon-button.tsx";
import { isEnrolled, verify } from "@/lib/lock/fingerprint.ts";
import { isSessionLapsed, writeUnlocked } from "@/lib/lock/session.ts";
import { unlock } from "@/lib/lock/unlock.ts";
import { copy } from "@/content/index.ts";

const lock = css`
  position: fixed;
  top: var(--vvt, 0);
  left: 0;
  right: 0;
  height: var(--vvh, 100%);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: env(safe-area-inset-top) calc(var(--space-xl) + env(safe-area-inset-right))
    env(safe-area-inset-bottom) calc(var(--space-xl) + env(safe-area-inset-left));
  background: var(--background-primary);
  animation: fade-in var(--motion-slow) var(--motion-easing) both;
`;

const shaking = css`
  animation: shake 360ms var(--motion-easing);

  @keyframes shake {
    20% {
      transform: translateX(-10px);
    }
    40% {
      transform: translateX(8px);
    }
    60% {
      transform: translateX(-6px);
    }
    80% {
      transform: translateX(3px);
    }
  }
`;

const panelBox = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 360px;
  gap: var(--space-lg);
`;

const wordmark = css`
  margin-bottom: var(--space-xl);
  text-align: center;
  font-size: var(--font-size-display-3xl);
  line-height: 1;
  color: var(--text-primary);
`;

const fieldBox = css`
  position: relative;

  & input {
    width: 100%;
    min-height: 56px;
    padding: 0 calc(var(--size-target) + var(--space-sm)) 0 var(--space-lg);
    border: var(--size-hair) solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--background-secondary);
    font-size: var(--font-size-body-md);
    transition: border-color var(--motion-fast) var(--motion-easing);
  }

  & input:focus-visible {
    border-color: var(--border-focus);
    outline-offset: 0;
  }
`;

const eye = css`
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
`;

const errorText = css`
  min-height: var(--space-xl);
  color: var(--text-danger);
  font-size: var(--font-size-body-sm);
  text-align: center;
`;

const errorInfo = css`
  .${errorText}& {
    color: var(--text-secondary);
  }
`;

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
    el.classList.remove(shaking);
    void el.offsetWidth;
    el.classList.add(shaking);
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
    <div className={lock} role="dialog" aria-modal="true" aria-label={copy.lock.dialog}>
      <form ref={panel} className={panelBox} noValidate onSubmit={(e) => void onSubmit(e)}>
        <h1 className={clsx(wordmark, "serif")}>brain</h1>
        <div className={fieldBox}>
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
            className={eye}
            aria-pressed={revealed}
            onClick={() => {
              setRevealed(!revealed);
              input.current?.focus();
            }}
          />
        </div>
        <p className={clsx(errorText, message.info && errorInfo)} role="alert">
          {message.text}
        </p>
        <Button type="submit" block disabled={busy}>
          {busy ? copy.lock.checking : copy.lock.unlock}
        </Button>
        <Button
          variant="outlined"
          block
          icon={<FingerprintIcon aria-hidden />}
          hidden={fingerHidden}
          onClick={() => void tryFingerprint()}
        >
          {copy.lock.useFingerprint}
        </Button>
      </form>
    </div>
  );
}
