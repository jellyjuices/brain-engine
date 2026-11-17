import "./add.css";
import { useEffect, useState } from "react";
import type { Finish } from "@/components/sheet/open-sheet.tsx";
import { Option, type OptionProps } from "@/components/sheet/option.tsx";
import { copy } from "@/content/index.ts";

export interface SearchItem<T> {
  key: string;
  value: T;
  option: Omit<OptionProps, "onClick">;
  match: string;
}

export interface SearchListProps<T> {
  title: string;
  placeholder: string;
  load: () => Promise<SearchItem<T>[]>;
  finish: Finish<T>;
}

const LIMIT = 30;

export function SearchList<T>({ title, placeholder, load, finish }: SearchListProps<T>) {
  const [pool, setPool] = useState<SearchItem<T>[]>([]);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = pool.filter((x) => !q || x.match.toLowerCase().includes(q)).slice(0, LIMIT);

  useEffect(() => {
    void load().then(setPool);
  }, [load]);

  return (
    <>
      <h2 className="serif sheet-title">{title}</h2>
      <input
        className="ask-input"
        type="search"
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        autoCapitalize="off"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && hits[0] && finish(hits[0].value)}
      />
      <div className="options sheet-results">
        {hits.length ? (
          hits.map((x) => <Option key={x.key} {...x.option} onClick={() => finish(x.value)} />)
        ) : (
          <p className="lede">{copy.common.nothingFound}</p>
        )}
      </div>
    </>
  );
}
