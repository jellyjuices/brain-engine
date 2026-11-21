import { useEffect } from "react";
import clsx from "clsx";
import styles from "./screen-host.module.css";
import { useRoute } from "@/hooks/use-route.ts";
import { DEFAULT_ROUTE, type Route } from "@/lib/platform/router.ts";
import { SCREENS } from "./screens.ts";
import { copy } from "@/content/index.ts";

const PADDED = new Set(["today", "find", "areas", "note"]);
const FLUSH = new Set(["journal"]);

function screenKey(route: Route): string {
  return `${route.name}/${route.rest}?${route.params}`;
}

function ScreenFrame({ route }: { route: Route }) {
  const { title, Component } = SCREENS[route.name];
  const editing = route.name === "note" && route.params.has("edit");
  return (
    <main
      className={clsx(
        styles.screen,
        PADDED.has(route.name) && styles.padded,
        (FLUSH.has(route.name) || editing) && styles.flush,
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

  useEffect(() => {
    const title = SCREENS[route.name].title;
    document.title =
      route.name === DEFAULT_ROUTE ? copy.common.appName : copy.common.pageTitle(title);
  }, [route.name]);

  return (
    <div className={styles.screenHost}>
      <ScreenFrame key={key} route={route} />
    </div>
  );
}
