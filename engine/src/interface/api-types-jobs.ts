export const JOB_KINDS = ["split", "enrich", "questions", "intake_summary"] as const;
export type JobKind = (typeof JOB_KINDS)[number];
export type JobState = "waiting" | "working" | "done" | "failed";
export type HelperState = "on" | "off" | "not answering";

export interface JobResult {
  counts: Record<string, number>;
  paths: string[];
}

export interface Job {
  id: string;
  kind: JobKind;
  note: string;
  state: JobState;
  tries: number;
  made: string;
  started?: string;
  finished?: string;
  reason?: string;
  undo_id?: string;
  by?: string;
  result?: JobResult;
  session?: string;
}

export interface JobsResponse {
  helper: HelperState;
  jobs: Job[];
}

export interface JobResponse {
  job: Job;
}

export interface WarmResponse {
  helper: "on" | "off";
}
