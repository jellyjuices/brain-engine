import { useEffect, useRef, useState } from "react";
import { onStoreChange } from "@/lib/storage/store.ts";
import type { Loaded } from "@/lib/sync/loaded.ts";

export function useLoaded<T>(
  load: () => Promise<Loaded<T>>,
  key: string,
): { loaded: Loaded<T>; retry: () => void } {
  const latest = useRef(load);
  const [state, setState] = useState<{ key: string; value: Loaded<T> } | null>(null);
  const [attempt, setAttempt] = useState(0);

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
  }, [key, attempt]);

  function retry() {
    setState(null);
    setAttempt((n) => n + 1);
  }

  const loaded: Loaded<T> = state?.key === key ? state.value : { kind: "loading" };
  return { loaded, retry };
}
