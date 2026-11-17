import "./mention.css";
import type { ReactNode } from "react";

export function Mention({ name, href }: { name: ReactNode; href?: string }) {
  if (href)
    return (
      <a className="mention" href={href}>
        @{name}
      </a>
    );
  return <span className="mention">@{name}</span>;
}
