import type { ComponentType } from "react";
import type { ScreenName } from "@/lib/platform/router.ts";
import { BrainScreen } from "@/screens/brain/brain.tsx";
import { FindScreen } from "@/screens/find/find.tsx";
import { GoalScreen } from "@/screens/goal/goal.tsx";
import { GoalTodosScreen } from "@/screens/goal-todos/goal-todos.tsx";
import { GoalsScreen } from "@/screens/goals/goals.tsx";
import { InboxScreen } from "@/screens/inbox/inbox.tsx";
import { IntakeScreen } from "@/screens/intake/intake.tsx";
import { ReportScreen } from "@/screens/report/report.tsx";
import { AddScreen } from "@/screens/add/add.tsx";
import { JournalScreen } from "@/screens/journal/journal.tsx";
import { NoteScreen } from "@/screens/note/note.tsx";
import { SettingsScreen } from "@/screens/settings/settings.tsx";
import { TodayScreen } from "@/screens/today/today.tsx";
import { TodosScreen } from "@/screens/todos/todos.tsx";
import { BuildScreen } from "@/screens/build/build.tsx";
import { FileScreen } from "@/screens/file/file.tsx";
import { copy } from "@/content/index.ts";

export const SCREENS: Record<ScreenName, { title: string; Component: ComponentType }> = {
  todos: { title: copy.nav.todos, Component: TodosScreen },
  goals: { title: copy.nav.goals, Component: GoalsScreen },
  goal: { title: copy.goals.kicker, Component: GoalScreen },
  "goal-todos": { title: copy.goals.addTodosTitle, Component: GoalTodosScreen },
  today: { title: copy.nav.today, Component: TodayScreen },
  find: { title: copy.nav.find, Component: FindScreen },
  add: { title: copy.nav.add, Component: AddScreen },
  journal: { title: copy.nav.journal, Component: JournalScreen },
  brain: { title: copy.nav.brain, Component: BrainScreen },
  note: { title: copy.nav.note, Component: NoteScreen },
  settings: { title: copy.nav.settings, Component: SettingsScreen },
  inbox: { title: copy.nav.inbox, Component: InboxScreen },
  intake: { title: copy.nav.intake, Component: IntakeScreen },
  report: { title: copy.nav.report, Component: ReportScreen },
  build: { title: copy.sort.build, Component: BuildScreen },
  file: { title: copy.sort.file, Component: FileScreen },
};
