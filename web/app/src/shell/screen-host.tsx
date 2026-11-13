import { useEffect, useState } from "react";
import clsx from "clsx";
import { useRoute } from "@/hooks/use-route.ts";
import { DEFAULT_ROUTE, type Route } from "@/lib/platform/router.ts";
import { SCREENS } from "./screens.ts";
import { copy } from "@/content/index.ts";

const LEAVE_MS = 160;

function screenKey(route: Route): string {
  return `${route.name}/${route.rest}?${route.params}`;
}

function ScreenFrame({ route, leaving }: { route: Route; leaving?: boolean }) {
  const { title, Component } = SCREENS[route.name];
  return (
    <main
      className={clsx(
        "screen",
        `screen--${route.name}`,
        route.name === "note" && route.params.has("edit") && "screen--editor",
        leaving && "leaving",
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
    <div className="screen-host">
      {leaving && <ScreenFrame key={leaving.key} route={leaving.route} leaving />}
      <ScreenFrame key={shown.key} route={shown.route} />
    </div>
  );
}
