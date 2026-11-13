import { api } from "./api.ts";

export type ReportResult =
  { kind: "ready"; markdown: string } | { kind: "offline" } | { kind: "missing" };

export async function fetchReport(name: string): Promise<ReportResult> {
  const res = await api<{ markdown?: unknown }>(`/api/reports/${name}`);
  if (res.ok) {
    return typeof res.data.markdown === "string"
      ? { kind: "ready", markdown: res.data.markdown }
      : { kind: "missing" };
  }
  return res.offline ? { kind: "offline" } : { kind: "missing" };
}
