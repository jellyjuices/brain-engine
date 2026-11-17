import clsx from "clsx";
import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowBendUpLeftIcon, TargetIcon, UsersIcon } from "@phosphor-icons/react";
import { AreaMark } from "../area-mark/area-mark.tsx";
import { Chip } from "../chip/chip.tsx";
import { WhenChip } from "../when-chip/when-chip.tsx";
import type { TodoRowProps } from "./todo-row.tsx";
import visually from "../visually-hidden/visually-hidden.module.css";
import styles from "./todo-row-meta.module.css";

type MetaProps = Pick<
  TodoRowProps,
  | "tag"
  | "areas"
  | "when"
  | "people"
  | "goal"
  | "goalAreas"
  | "check"
  | "checkLabel"
  | "from"
  | "markLabels"
  | "disabled"
>;

export function hasMeta(p: MetaProps) {
  return Boolean(p.tag || p.when || p.people?.length || p.goal || p.check || p.from);
}

interface ExtraProps {
  glyph: Icon;
  mark?: ReactNode;
  hidden?: string;
  children: string;
}

function Extra({ glyph: Glyph, mark, hidden, children }: ExtraProps) {
  return (
    <span className={styles.extra}>
      {mark ?? <Glyph aria-hidden className={styles.extraGlyph} />}
      {hidden && <span className={visually.hidden}>{hidden} </span>}
      {children}
    </span>
  );
}

export function TodoRowMeta({
  tag,
  areas,
  when,
  people,
  goal,
  goalAreas,
  check,
  checkLabel = "check",
  from,
  markLabels,
  disabled,
}: MetaProps) {
  return (
    <div className={clsx(styles.meta, disabled && styles.disabled)}>
      {tag && <Chip label={tag} areas={areas} disabled={disabled} />}
      {when && <WhenChip {...when} />}
      {people && people.length > 0 && (
        <Extra glyph={UsersIcon} hidden={markLabels?.people}>
          {people.join(", ")}
        </Extra>
      )}
      {goal && (
        <Extra
          glyph={TargetIcon}
          hidden={markLabels?.goal}
          mark={goalAreas?.length ? <AreaMark areas={goalAreas} /> : undefined}
        >
          {goal}
        </Extra>
      )}
      {check && <Chip label={checkLabel} variant="check" disabled={disabled} />}
      {from && (
        <Extra glyph={ArrowBendUpLeftIcon} hidden={markLabels?.from}>
          {from}
        </Extra>
      )}
    </div>
  );
}
