import "./field.css";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Ref } from "react";
import { Icon } from "@/components/icon/icon.tsx";
import { copy } from "@/content/index.ts";

export interface SearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchInput({
  value,
  placeholder,
  onChange,
  onEnter,
  autoFocus = true,
  inputRef,
}: SearchInputProps) {
  return (
    <div className="search">
      <Icon icon={MagnifyingGlassIcon} />
      <input
        ref={inputRef}
        className="input search-input"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      />
      {value && (
        <button
          className="search-clear"
          type="button"
          aria-label={copy.common.clear}
          onClick={() => onChange("")}
        >
          <Icon icon={XIcon} />
        </button>
      )}
    </div>
  );
}
