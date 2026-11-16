import { css } from "@linaria/core";
import { CalendarCheckIcon, CheckIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { row, rowEnd, rowIcon, rowMain, rowSub, rowTitle } from "@/components/row/row.styles.ts";
import { Chip } from "@/components/chip/chip.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { Mention } from "@/components/mention/mention.tsx";
import { Swipe } from "@/components/swipe/swipe.tsx";
import { openTodo, tomorrow } from "@/flows/todo-flow.ts";
import { niceDate } from "@/lib/notes/model.ts";
import { inline, type InlineToken } from "@/lib/notes/markdown.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import { copy } from "@/content/index.ts";

const todoLink = css`
  color: var(--text-accent);
  text-decoration: underline;
  text-decoration-thickness: var(--size-hair);
  text-underline-offset: 3px;
`;

const todoMain = css`
  & .${rowSub} {
    display: flex;
  }
`;

const overdueEnd = css`
  .${rowEnd}& {
    color: var(--text-danger);
  }
`;

function TodoText({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((tok, i) => {
    if (tok.t === "text") return tok.text;
    if (tok.t === "code") return <code key={i}>{tok.text}</code>;
    const kids = <TodoText tokens={tok.children} />;
    if (tok.t === "link" && tok.person) return <Mention key={i} name={kids} />;
    if (tok.t === "link")
      return (
        <span key={i} className={todoLink}>
          {kids}
        </span>
      );
    const Tag = tok.t;
    return <Tag key={i}>{kids}</Tag>;
  });
}

export interface TodoRowProps {
  todo: TodoRef;
  showSubject?: boolean;
  overdue?: boolean;
}

export function TodoRow({ todo, showSubject = true, overdue }: TodoRowProps) {
  const event = todo.kind === "event";
  const subject = showSubject && !event ? todo.subject : undefined;
  return (
    <Swipe
      right={{
        label: copy.todo.swipeDone,
        icon: CheckIcon,
        onSwipe: (collapse) => openTodo(todo, "done", collapse),
      }}
      left={{
        label: copy.todo.swipeLater,
        away: true,
        onSwipe: (collapse) => tomorrow(todo, collapse),
      }}
      onTap={(collapse) => void openTodo(todo, "menu", collapse)}
    >
      <button className={clsx(row, todoMain)} type="button">
        {event && (
          <span className={rowIcon}>
            <Icon icon={CalendarCheckIcon} />
          </span>
        )}
        <span className={rowMain}>
          <span className={rowTitle}>
            <TodoText tokens={inline(todo.text, todo.path)} />
          </span>
          {subject && (
            <span className={rowSub}>
              <Chip size="sm">{subject}</Chip>
            </span>
          )}
        </span>
        {todo.due && (
          <span className={clsx(rowEnd, overdue && overdueEnd)}>{niceDate(todo.due)}</span>
        )}
      </button>
    </Swipe>
  );
}
