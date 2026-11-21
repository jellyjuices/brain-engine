import { useRoute } from "@/hooks/use-route.ts";
import { isBuildKind } from "@/lib/notes/build-kinds.ts";
import { GoalBuild } from "./goal-build.tsx";
import { SubjectBuild } from "./subject-build.tsx";

export function BuildScreen() {
  const { rest } = useRoute();
  if (rest === "goal") return <GoalBuild />;
  if (!isBuildKind(rest)) return null;
  return <SubjectBuild key={rest} kind={rest} />;
}
