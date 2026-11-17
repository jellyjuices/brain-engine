import { typeLook } from "@/lib/notes/kinds.ts";
import { SearchList } from "@/components/search-list/search-list.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { WAIT_ON_TYPES } from "@/lib/notes/types.ts";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export interface TodoWaitPickProps extends TodoStepProps {
  kind: "someone" | "something";
}

export function TodoWaitPick({ todo, now, finish, show, kind }: TodoWaitPickProps) {
  const notes = useNotes() ?? [];
  const person = kind === "someone";
  const items = notes
    .filter((n) => (person ? n.type === "Person" : WAIT_ON_TYPES.includes(n.type ?? "")))
    .sort((x, y) => x.title.localeCompare(y.title))
    .map((n) => ({
      key: n.path,
      value: n.title,
      match: n.title,
      row: { ...typeLook(n.type), title: n.title, sub: n.type },
    }));

  function save(name: string) {
    finish({ kind: "move", when: "waiting", ...(person ? { who: name } : { what: name }) });
  }

  return (
    <>
      <TodoSheetHead
        todo={todo}
        now={now}
        title={person ? copy.todo.whoWaiting : copy.todo.whatWaiting}
        onBack={() => show("hold")}
      />
      <SearchList
        placeholder={person ? copy.todo.searchPeople : copy.todo.searchNotes}
        items={items}
        limit={6}
        onPick={save}
        onAdd={save}
      />
    </>
  );
}
