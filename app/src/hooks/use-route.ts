import { useSyncExternalStore } from "react";
import { routeSnapshot, subscribeRoute, type Route } from "@/lib/platform/router.ts";

export function useRoute(): Route {
  return useSyncExternalStore(subscribeRoute, routeSnapshot);
}
