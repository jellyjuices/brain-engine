import styles from "./search-list.module.css";
import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { List } from "@/components/row/list.tsx";
import { Row, type RowProps } from "@/components/row/row.tsx";
import { SearchInput } from "@/components/field/search-input.tsx";
import { Empty } from "@/components/empty/empty.tsx";
import { copy } from "@/content/index.ts";

export interface SearchItem<T> {
  key: string;
  value: T;
  match: string;
  row: Omit<RowProps, "onClick">;
}

export interface SearchListProps<T> {
  placeholder: string;
  items: SearchItem<T>[];
  onPick: (value: T) => void;
  onAdd?: (name: string) => void;
  chevron?: boolean;
  limit?: number;
}

export function SearchList<T>({
  placeholder,
  items,
  onPick,
  onAdd,
  chevron,
  limit = 30,
}: SearchListProps<T>) {
  const [query, setQuery] = useState("");
  const name = query.trim();
  const q = name.toLowerCase();
  const hits = items.filter((x) => !q || x.match.toLowerCase().includes(q)).slice(0, limit);
  const showAdd = !!onAdd && !!q && !hits.some((x) => x.match.toLowerCase() === q);

  function pickFirst() {
    if (hits[0]) onPick(hits[0].value);
    else if (showAdd) onAdd?.(name);
  }

  return (
    <>
      <SearchInput
        placeholder={placeholder}
        value={query}
        onChange={setQuery}
        onEnter={pickFirst}
      />
      <div className={styles.searchResults}>
        {hits.length || showAdd ? (
          <List variant="ghost">
            {hits.map((x) => (
              <Row key={x.key} chevron={chevron} {...x.row} onClick={() => onPick(x.value)} />
            ))}
            {showAdd && (
              <Row
                icon={PlusIcon}
                variant="primary"
                title={copy.common.addItem(name)}
                onClick={() => onAdd?.(name)}
              />
            )}
          </List>
        ) : (
          <Empty size="sm" title={copy.common.nothingFound} />
        )}
      </div>
    </>
  );
}
