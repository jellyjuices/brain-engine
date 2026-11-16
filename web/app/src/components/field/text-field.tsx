import * as s from "./field.styles.ts";
import { useId, type Ref } from "react";

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideLabel?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  autoCapitalize?: "sentences" | "words" | "off";
  enterKeyHint?: "done" | "next";
  onEnter?: () => void;
  inputRef?: Ref<HTMLInputElement & HTMLTextAreaElement>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hideLabel,
  multiline,
  autoFocus,
  autoCapitalize = "sentences",
  enterKeyHint = "done",
  onEnter,
  inputRef,
}: TextFieldProps) {
  const id = useId();
  const shared = {
    id,
    ref: inputRef,
    className: s.input,
    placeholder,
    autoFocus,
    autoCapitalize,
    autoComplete: "off",
    enterKeyHint,
    value,
    "aria-label": hideLabel ? label : undefined,
  };
  return (
    <div className={s.field}>
      {!hideLabel && (
        <label className="section-label" htmlFor={id}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea {...shared} rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...shared}
          type="text"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        />
      )}
    </div>
  );
}
