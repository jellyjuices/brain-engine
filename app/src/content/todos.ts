export const todos = {
  title: "To-dos",
  views: "To-do views",
  viewToday: "Today",
  viewSoon: "Soon",
  viewNoDate: "No date",
  viewOnHold: "On hold",
  viewByGoal: "By goal",
  viewAll: "All",
  moreNoDate: (count: number) =>
    count === 1 ? "1 more has no date" : `${count} more have no date`,
  emptyToday: "Nothing due today",
  emptySoon: "Nothing due soon",
  emptyNoDate: "Every to-do has a date",
  emptyOnHold: "Nothing on hold",
  emptyByGoal: "No to-dos move you toward a goal yet",
  emptyAll: "No to-dos",
  doneOn: (subject: string) => `Done. It's on the ${subject} timeline.`,
  doneOnGoal: (subject: string, goal: string) =>
    `Done. It's on the ${subject} timeline and counts toward ${goal}.`,
  followUp: "Follow-up",
  waiting: "On hold",
};
