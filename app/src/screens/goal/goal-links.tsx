import { TimelineEntry } from "@/components/timeline-entry/timeline-entry.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { SubgoalLink } from "@/components/subgoal-link/subgoal-link.tsx";
import type { GoalView } from "@shared/todos/index.ts";
import { linkedPaths, titleAt } from "@/lib/notes/goals.ts";
import { niceDate, noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { plainText } from "@/lib/notes/search.ts";
import { go } from "@/lib/platform/router.ts";
import { GoalSection } from "./goal-section.tsx";
import styles from "./goal.module.css";
import { copy } from "@/content/index.ts";

export interface GoalLinksProps {
  goal: GoalView;
  notes: StoredNote[] | null;
}

export function GoalLinks({ goal, notes }: GoalLinksProps) {
  const projects = linkedPaths(goal);
  return (
    <>
      {projects.length > 0 && (
        <GoalSection title={copy.goals.projects}>
          <List>
            {projects.map((path) => (
              <ListRow key={path} title={titleAt(notes, path)} href={noteHref(path)} chevron />
            ))}
          </List>
        </GoalSection>
      )}
      {goal.wins.length > 0 && (
        <GoalSection title={copy.goals.wins} count={goal.wins.length}>
          <List variant="plain">
            {goal.wins.map((win) => (
              <TimelineEntry
                key={`${win.path}::${win.text}`}
                date={win.date ?? ""}
                dateLabel={win.date ? niceDate(win.date) : ""}
                kind={copy.goals.win}
                text={plainText(win.text)}
                onOpen={() => go(noteHref(win.path))}
              />
            ))}
          </List>
        </GoalSection>
      )}
      {goal.subgoals.length > 0 && (
        <GoalSection title={copy.goals.subgoals}>
          <div className={styles.subs}>
            {goal.subgoals.map((sub) => (
              <SubgoalLink key={sub.path} goal={sub} />
            ))}
          </div>
        </GoalSection>
      )}
      {goal.decisions.length > 0 && (
        <GoalSection title={copy.goals.decisions}>
          <List>
            {goal.decisions.map((d) => (
              <ListRow key={d.path} title={d.title} href={noteHref(d.path)} chevron />
            ))}
          </List>
        </GoalSection>
      )}
    </>
  );
}
