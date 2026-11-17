import { useEffect, useRef, useState } from "react";
import { onStoreChange } from "@/lib/storage/store.ts";
import type { Loaded } from "@/lib/sync/loaded.ts";

export function useLoaded<T>(load: () => Promise<Loaded<T>>, key: string): Loaded<T> {
  const latest = useRef(load);
  const [state, setState] = useState<{ key: string; value: Loaded<T> } | null>(null);

  useEffect(() => {
    latest.current = load;
  });

  useEffect(() => {
    let alive = true;
    function run() {
      void latest.current().then((value) => alive && setState({ key, value }));
    }
    run();
    const stop = onStoreChange(run);
    return () => {
      alive = false;
      stop();
    };
  }, [key]);

  return state?.key === key ? state.value : { kind: "loading" };
}
