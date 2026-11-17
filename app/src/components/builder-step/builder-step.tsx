import styles from "./builder-step.module.css";
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowLeftIcon, XIcon } from "@phosphor-icons/react";
import { Bar } from "../bar/bar.tsx";
import { Button } from "../button/button.tsx";
import { IconButton } from "../icon-button/icon-button.tsx";

export type BuilderStepProps = {
  title: string;
  step: number;
  count: number;
  stepLabel: string;
  question: string;
  hint?: string;
  children?: ReactNode;
  backLabel: string;
  nextLabel: string;
  skipLabel?: string;
  closeLabel?: string;
  nextDisabled?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onClose?: () => void;
};

export const BuilderStep = (props: BuilderStepProps) => {
  const {
    step,
    count,
    stepLabel,
    question,
    hint,
    children,
    backLabel,
    nextLabel,
    skipLabel,
    closeLabel,
  } = props;
  const { nextDisabled, onBack, onNext, onSkip, onClose } = props;
  const headingId = useId();
  const hintId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nextDisabled) onNext();
  };

  return (
    <form
      className={styles.builderStep}
      aria-labelledby={headingId}
      aria-describedby={hint ? hintId : undefined}
      onSubmit={submit}
    >
      <header className={styles.head}>
        {onClose && closeLabel && <IconButton icon={XIcon} label={closeLabel} onClick={onClose} />}
        <p className={styles.title}>{props.title}</p>
        <p className={styles.countText} aria-live="polite">
          {stepLabel}
        </p>
      </header>
      <Bar label={stepLabel} done={step + 1} total={count} size="step" />
      <h2 id={headingId} ref={heading} tabIndex={-1} className={styles.questionText}>
        {question}
      </h2>
      {hint && (
        <p id={hintId} className={styles.hintText}>
          {hint}
        </p>
      )}
      <div className={styles.body}>{children}</div>
      <footer className={styles.foot}>
        {onSkip && skipLabel && (
          <Button variant="ghost" className={styles.skip} onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        <div className={styles.nav}>
          {onBack && (
            <Button variant="secondary" size="lg" icon={ArrowLeftIcon} onClick={onBack}>
              {backLabel}
            </Button>
          )}
          <Button type="submit" size="lg" block disabled={nextDisabled}>
            {nextLabel}
          </Button>
        </div>
      </footer>
    </form>
  );
};
