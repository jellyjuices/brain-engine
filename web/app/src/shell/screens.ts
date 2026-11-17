import type { ComponentType } from "react";
import type { ScreenName } from "@/lib/platform/router.ts";
import { AddScreen } from "@/screens/add/add.tsx";
import { BrainScreen } from "@/screens/brain/brain.tsx";
import { FindScreen } from "@/screens/find/find.tsx";
import { InboxScreen } from "@/screens/inbox/inbox.tsx";
import { IntakeScreen } from "@/screens/intake/intake.tsx";
import { ReportScreen } from "@/screens/report/report.tsx";
import { NewScreen } from "@/screens/new/new.tsx";
import { WriteScreen } from "@/screens/write/write.tsx";
import { NoteScreen } from "@/screens/note/note.tsx";
import { SettingsScreen } from "@/screens/settings/settings.tsx";
import { TodayScreen } from "@/screens/today/today.tsx";
import { TodosScreen } from "@/screens/todos/todos.tsx";
import { copy } from "@/content/index.ts";

export const SCREENS: Record<ScreenName, { title: string; Component: ComponentType }> = {
  todos: { title: copy.nav.todos, Component: TodosScreen },
  today: { title: copy.nav.today, Component: TodayScreen },
  find: { title: copy.nav.find, Component: FindScreen },
  add: { title: copy.nav.add, Component: AddScreen },
  new: { title: copy.nav.add, Component: NewScreen },
  write: { title: copy.nav.journal, Component: WriteScreen },
  brain: { title: copy.nav.brain, Component: BrainScreen },
  note: { title: copy.nav.note, Component: NoteScreen },
  settings: { title: copy.nav.settings, Component: SettingsScreen },
  inbox: { title: copy.nav.inbox, Component: InboxScreen },
  intake: { title: copy.nav.intake, Component: IntakeScreen },
  report: { title: copy.nav.report, Component: ReportScreen },
};
