import "@/components/row/row.css";
import "./todo-row.css";
import { CalendarCheckIcon, CheckIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Chip } from "@/components/chip/chip.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { Mention } from "@/components/mention/mention.tsx";
import { Swipe } from "@/components/swipe/swipe.tsx";
import { openTodo, tomorrow } from "@/flows/todo-flow.ts";
import { niceDate } from "@/lib/notes/model.ts";
import { inline, type InlineToken } from "@/lib/notes/markdown.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import { copy } from "@/content/index.ts";

function TodoText({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((tok, i) => {
    if (tok.t === "text") return tok.text;
    if (tok.t === "code") return <code key={i}>{tok.text}</code>;
    const kids = <TodoText tokens={tok.children} />;
    if (tok.t === "link" && tok.person) return <Mention key={i} name={kids} />;
    if (tok.t === "link")
      return (
        <span key={i} className="todo-link">
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
      <button className="row todo-main" type="button">
        {event && (
          <span className="row-icon">
            <Icon icon={CalendarCheckIcon} />
          </span>
        )}
        <span className="row-main">
          <span className="row-title">
            <TodoText tokens={inline(todo.text, todo.path)} />
          </span>
          {subject && (
            <span className="row-sub">
              <Chip size="sm">{subject}</Chip>
            </span>
          )}
        </span>
        {todo.due && (
          <span className={clsx("row-end", overdue && "is-overdue")}>{niceDate(todo.due)}</span>
        )}
      </button>
    </Swipe>
  );
}
