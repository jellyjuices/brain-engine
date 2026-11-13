export const today = {
  noNotesTitle: "No notes yet",
  noNotesBody: "Your notes appear once this phone connects to your Mac.",
  nothingToday: "Nothing due today",
  overdue: "Overdue",
  noDateYet: "No date",
  dueToday: "Due today",
  dueTomorrow: "Due tomorrow",
  dueOn: (date: string) => `Due ${date}`,
  dueLate: (date: string, days: string) => `Due ${date} · ${days} late`,
  oneDay: "1 day",
  manyDays: (n: number) => `${n} days`,
};
