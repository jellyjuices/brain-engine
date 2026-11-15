import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { ArrowLeftIcon, XIcon } from '@phosphor-icons/react'
import { Bar } from '../bar/bar.tsx'
import { Button } from '../button/button.tsx'
import { IconButton } from '../icon-button/icon-button.tsx'
import './builder-step.css'

export type BuilderStepProps = {
  title: string
  step: number
  count: number
  stepLabel: string
  question: string
  hint?: string
  children?: ReactNode
  backLabel: string
  nextLabel: string
  skipLabel?: string
  closeLabel?: string
  nextDisabled?: boolean
  onBack?: () => void
  onNext: () => void
  onSkip?: () => void
  onClose?: () => void
}

export const BuilderStep = (props: BuilderStepProps) => {
  const { title, step, count, stepLabel, question, hint, children, backLabel, nextLabel, skipLabel, closeLabel } = props
  const { nextDisabled, onBack, onNext, onSkip, onClose } = props
  const headingId = useId()
  const hintId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!nextDisabled) onNext()
  }

  return (
    <form className="builder-step" aria-labelledby={headingId} aria-describedby={hint ? hintId : undefined} onSubmit={submit}>
      <header className="builder-step-head">
        {onClose && closeLabel && <IconButton icon={XIcon} label={closeLabel} onClick={onClose} />}
        <p className="builder-step-title">{title}</p>
        <p className="builder-step-count" aria-live="polite">
          {stepLabel}
        </p>
      </header>
      <Bar label={stepLabel} done={step + 1} total={count} size="step" />
      <h2 id={headingId} ref={heading} tabIndex={-1} className="builder-step-question">
        {question}
      </h2>
      {hint && (
        <p id={hintId} className="builder-step-hint">
          {hint}
        </p>
      )}
      <div className="builder-step-body">{children}</div>
      <footer className="builder-step-foot">
        {onSkip && skipLabel && (
          <Button variant="ghost" className="builder-step-skip" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        <div className="builder-step-nav">
          {onBack && (
            <Button variant="secondary" size="lg" icon={<ArrowLeftIcon aria-hidden />} onClick={onBack}>
              {backLabel}
            </Button>
          )}
          <Button type="submit" size="lg" block disabled={nextDisabled}>
            {nextLabel}
          </Button>
        </div>
      </footer>
    </form>
  )
}
