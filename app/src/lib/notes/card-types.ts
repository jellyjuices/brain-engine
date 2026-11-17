export interface CardTodo {
  text: string;
  path: string;
  noteTitle: string;
  due?: string;
  ref?: string;
}
export interface CardLine {
  date: string;
  text: string;
  path: string;
}
export interface CardRelation {
  direction: "out" | "in";
  path: string;
  title: string;
  role?: string;
  heading: string;
  time?: string;
}
export interface CardSummary {
  path: string;
  title: string;
  type?: string;
  description: string;
}
export interface Card {
  subject: CardSummary;
  todo: CardTodo[];
  next?: { date: string; text: string; path: string };
  history: CardLine[];
  relations: CardRelation[];
  related: CardSummary[];
}
