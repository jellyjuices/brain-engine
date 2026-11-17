import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowBendUpLeftIcon, TargetIcon, UsersIcon } from "@phosphor-icons/react";
import { AreaMark } from "../area-mark/area-mark.tsx";
import { Chip } from "../chip-next/chip.tsx";
import { WhenChip } from "../when-chip/when-chip.tsx";
import type { TodoRowProps } from "./todo-row.tsx";
import { visuallyHidden } from "../visually-hidden/visually-hidden.ts";
import { extra, extraGlyph, meta } from "./todo-row-meta.styles.ts";

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

export const hasMeta = (p: MetaProps) =>
  Boolean(p.tag || p.when || p.people?.length || p.goal || p.check || p.from);

const Extra = ({
  glyph: Glyph,
  mark,
  hidden,
  children,
}: {
  glyph: Icon;
  mark?: ReactNode;
  hidden?: string;
  children: string;
}) => (
  <span className={extra}>
    {mark ?? <Glyph aria-hidden className={extraGlyph} />}
    {hidden && <span className={visuallyHidden}>{hidden} </span>}
    {children}
  </span>
);

export const TodoRowMeta = ({
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
}: MetaProps) => (
  <div className={meta}>
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
