import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./screen-host.module.css";
import { useRoute } from "@/hooks/use-route.ts";
import { DEFAULT_ROUTE, type Route } from "@/lib/platform/router.ts";
import { SCREENS } from "./screens.ts";
import { copy } from "@/content/index.ts";

const LEAVE_MS = 160;
const PADDED = new Set(["today", "find", "areas", "note"]);
const FLUSH = new Set(["journal"]);
const BARE = new Set(["build", "file"]);

function screenKey(route: Route): string {
  return `${route.name}/${route.rest}?${route.params}`;
}

function ScreenFrame({ route, leaving }: { route: Route; leaving?: boolean }) {
  const { title, Component } = SCREENS[route.name];
  const editing = route.name === "note" && route.params.has("edit");
  return (
    <main
      className={clsx(
        styles.screen,
        PADDED.has(route.name) && styles.padded,
        (FLUSH.has(route.name) || editing) && styles.flush,
        BARE.has(route.name) && styles.bare,
        leaving && styles.leaving,
      )}
      aria-label={title}
    >
      <Component />
    </main>
  );
}

export function ScreenHost() {
  const route = useRoute();
  const key = screenKey(route);
  const [shown, setShown] = useState({ key, route });
  const [leaving, setLeaving] = useState<{ key: string; route: Route } | null>(null);

  if (shown.key !== key) {
    setLeaving(shown);
    setShown({ key, route });
  }

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    const title = SCREENS[route.name].title;
    document.title =
      route.name === DEFAULT_ROUTE ? copy.common.appName : copy.common.pageTitle(title);
  }, [route.name]);

  return (
    <div className={styles.screenHost}>
      {leaving && <ScreenFrame key={leaving.key} route={leaving.route} leaving />}
      <ScreenFrame key={shown.key} route={shown.route} />
    </div>
  );
}
