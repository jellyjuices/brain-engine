import { css } from "@linaria/core";
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowLeftIcon, XIcon } from "@phosphor-icons/react";
import { Bar } from "../bar/bar.tsx";
import { Button } from "../button/button.tsx";
import { IconButton } from "../icon-button/icon-button.tsx";

const builderStep = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-height: 100%;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  background: var(--background-primary);
  color: var(--text-primary);

  @media (min-width: 48rem) {
    max-width: var(--size-max-width);
    margin: 0 auto;
  }
`;

const head = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--size-control);
`;

const title = css`
  flex: 1;
  margin: 0;
  font-weight: var(--font-weight-semibold);
`;

const countText = css`
  margin: 0;
  font-family: var(--font-number);
  font-size: var(--font-size-number-sm);
  color: var(--text-secondary);
`;

const questionText = css`
  margin: var(--space-md) 0 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-xl);
  font-weight: var(--font-weight-regular);
  line-height: var(--font-leading-tight);

  &:focus-visible {
    outline-offset: var(--space-xs);
  }
`;

const hintText = css`
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`;

const body = css`
  flex: 1;
`;

const foot = css`
  display: grid;
  gap: var(--space-sm);
`;

const skip = css`
  justify-self: center;
`;

const nav = css`
  display: flex;
  gap: var(--space-sm);
`;

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
      className={builderStep}
      aria-labelledby={headingId}
      aria-describedby={hint ? hintId : undefined}
      onSubmit={submit}
    >
      <header className={head}>
        {onClose && closeLabel && <IconButton icon={XIcon} label={closeLabel} onClick={onClose} />}
        <p className={title}>{props.title}</p>
        <p className={countText} aria-live="polite">
          {stepLabel}
        </p>
      </header>
      <Bar label={stepLabel} done={step + 1} total={count} size="step" />
      <h2 id={headingId} ref={heading} tabIndex={-1} className={questionText}>
        {question}
      </h2>
      {hint && (
        <p id={hintId} className={hintText}>
          {hint}
        </p>
      )}
      <div className={body}>{children}</div>
      <footer className={foot}>
        {onSkip && skipLabel && (
          <Button variant="ghost" className={skip} onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        <div className={nav}>
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
