export type WhenStatus = "overdue" | "waiting" | "today" | "due" | "someday";

export type WhenInput = {
  due?: string;
  someday?: boolean;
  waiting?: boolean;
};

const dayOf = (iso: string) => iso.slice(0, 10);

export const whenStatus = (
  { due, someday, waiting }: WhenInput,
  today: string,
): WhenStatus | undefined => {
  const day = due && dayOf(due);
  if (day && day < dayOf(today)) return "overdue";
  if (waiting) return "waiting";
  if (day) return day === dayOf(today) ? "today" : "due";
  if (someday) return "someday";
  return undefined;
};
