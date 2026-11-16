import { factLink } from "./facts.styles.ts";
import { noteHref, resolveLink } from "@/lib/notes/model.ts";

export function FactValue({ from, value }: { from: string; value: string }) {
  const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(value);
  const target = m && resolveLink(from, m[2]!);
  if (!target) return value;
  return (
    <a className={factLink} href={noteHref(target)}>
      {m[1]}
    </a>
  );
}
