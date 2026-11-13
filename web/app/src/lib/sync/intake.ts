import { api } from "./api.ts";

export interface IntakeQuestion {
  question: string;
  lens: string;
  privacy: "full" | "headline";
}

export type IntakeResult = { kind: "ready"; questions: IntakeQuestion[] } | { kind: "offline" };

export async function fetchIntakeQuestions(): Promise<IntakeResult> {
  const res = await api<{ threads?: IntakeQuestion[] }>("/api/intake/next");
  if (!res.ok) return { kind: "offline" };
  return { kind: "ready", questions: res.data.threads ?? [] };
}
