import { api } from "./api.ts";
import { failed } from "./loaded.ts";

export type ReportResult =
  | { kind: "ready"; markdown: string }
  | { kind: "offline" }
  | { kind: "missing" }
  | { kind: "error" };

export async function fetchReport(name: string): Promise<ReportResult> {
  const res = await api<{ markdown?: unknown }>(`/api/reports/${name}`);
  if (res.ok) {
    return typeof res.data.markdown === "string"
      ? { kind: "ready", markdown: res.data.markdown }
      : { kind: "error" };
  }
  return failed(res);
}
