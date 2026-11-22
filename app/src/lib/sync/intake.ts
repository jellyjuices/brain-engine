import { api } from "./api.ts";

export interface IntakeQuestion {
  question: string;
  lens: string;
  privacy: "full" | "headline";
}

export type IntakeResult =
  { kind: "ready"; questions: IntakeQuestion[] } | { kind: "offline" } | { kind: "error" };

export async function fetchIntakeQuestions(): Promise<IntakeResult> {
  const res = await api<{ threads?: IntakeQuestion[] }>("/api/intake/next");
  if (!res.ok) return res.offline ? { kind: "offline" } : { kind: "error" };
  return { kind: "ready", questions: res.data.threads ?? [] };
}
