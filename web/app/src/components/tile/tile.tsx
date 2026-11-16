import "./tile.css";

export interface TileProps {
  label: string;
  sub: string;
  autoFocus?: boolean;
  onClick: () => void;
}

export function Tile({ label, sub, autoFocus, onClick }: TileProps) {
  return (
    <button className="tile tile--choice" type="button" autoFocus={autoFocus} onClick={onClick}>
      <span className="tile-label">{label}</span>
      <span className="tile-sub">{sub}</span>
    </button>
  );
}
