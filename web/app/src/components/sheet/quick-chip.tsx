export interface QuickChipProps {
  label: string;
  sub: string;
  autoFocus?: boolean;
  onClick: () => void;
}

export function QuickChip({ label, sub, autoFocus, onClick }: QuickChipProps) {
  return (
    <button className="quick-chip" type="button" autoFocus={autoFocus} onClick={onClick}>
      <strong>{label}</strong>
      <span>{sub}</span>
    </button>
  );
}
