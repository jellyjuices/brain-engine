import styles from "./wizard-step.module.css";
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ProgressBar } from "../progress-bar/progress-bar.tsx";
import { Button } from "../button/button.tsx";
import { PageHeader } from "../page-header/page-header.tsx";

export type WizardStepProps = {
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
  nextDisabled?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onClose?: () => void;
};

export const WizardStep = (props: WizardStepProps) => {
  const { step, count, stepLabel, question, hint, children, backLabel, nextLabel, skipLabel } =
    props;
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
      className={styles.wizardStep}
      aria-labelledby={headingId}
      aria-describedby={hint ? hintId : undefined}
      onSubmit={submit}
    >
      <PageHeader
        title={props.title}
        onBack={onClose}
        backLabel={backLabel}
        action={
          count > 1 && (
            <p className={styles.countText} aria-live="polite">
              {stepLabel}
            </p>
          )
        }
      />
      {count > 1 && <ProgressBar label={stepLabel} done={step + 1} total={count} size="step" />}
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
