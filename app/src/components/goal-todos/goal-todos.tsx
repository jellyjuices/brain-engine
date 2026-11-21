import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { Combobox, type Suggestion } from "@/components/combobox/combobox.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import type { TodoPick } from "@/lib/notes/goal-link.ts";
import styles from "./goal-todos.module.css";
import { copy } from "@/content/index.ts";

const words = copy.goals;

export interface GoalTodosProps {
  choices: TodoPick[];
  items: TodoPick[];
  onChange: (items: TodoPick[]) => void;
}

function suggestionOf(pick: TodoPick): Suggestion {
  return { id: pick.key, label: pick.text, hint: pick.noteTitle };
}

export function GoalTodos({ choices, items, onChange }: GoalTodosProps) {
  const [query, setQuery] = useState("");
  const name = query.replace(/\s+/g, " ").trim();
  const taken = new Set(items.map((item) => item.key));
  const open = choices.filter((c) => !taken.has(c.key));

  function pick(item: TodoPick) {
    if (!taken.has(item.key)) onChange([...items, item]);
    setQuery("");
  }

  function create() {
    if (!name) return;
    const same = choices.find((c) => c.text.toLowerCase() === name.toLowerCase());
    pick(same ?? { key: `new::${name.toLowerCase()}`, text: name });
  }

  return (
    <>
      <Combobox
        label={words.todosPlaceholder}
        placeholder={words.todosPlaceholder}
        hideLabel
        suggestions={open.map(suggestionOf)}
        value={query}
        onValueChange={setQuery}
        onPick={(s) => {
          const found = open.find((c) => c.key === s.id);
          if (found) pick(found);
        }}
        onSubmit={create}
        clearOnPick
      />
      {items.length > 0 && (
        <section className={styles.added} aria-label={words.todosAdded}>
          <SectionHeader title={words.todosAdded} count={items.length} as="h3" />
          <List variant="ghost">
            {items.map((item) => (
              <ListRow
                key={item.key}
                title={item.text}
                sub={item.noteTitle}
                checked
                onClick={() => onChange(items.filter((x) => x.key !== item.key))}
              />
            ))}
          </List>
        </section>
      )}
      <Button variant="outlined" icon={PlusIcon} block disabled={!name} onClick={create}>
        {words.addTodo}
      </Button>
    </>
  );
}
