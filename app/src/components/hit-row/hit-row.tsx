import "./hit-row.css";
import type { MouseEvent } from "react";
import { cardType } from "@/components/card/card.styles.ts";
import { noteHref } from "@/lib/notes/model.ts";

export interface HitRowProps {
  path: string;
  title: string;
  type?: string;
  sub?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function HitRow({ path, title, type, sub, onClick }: HitRowProps) {
  return (
    <a className="hit" href={noteHref(path)} onClick={onClick}>
      <span className="hit-top">
        <span className="hit-title">{title}</span>
        {type && <span className={cardType}>{type}</span>}
      </span>
      {sub && <span className="hit-sub">{sub}</span>}
    </a>
  );
}
