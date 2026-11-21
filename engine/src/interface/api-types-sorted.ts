import type { WriteResult } from "./api-types.ts";

export type LineKind = "to-do" | "fact" | "feeling";

export interface SortedLine {
  line: string;
  text: string;
  kind: LineKind;
  check: boolean;
}

export interface SortedSubject {
  path: string;
  title: string;
  lines: SortedLine[];
}

export interface SortedResponse {
  count: number;
  subjects: SortedSubject[];
}

export interface MoveLineRequest {
  path: string;
  line: string;
  into: string;
}

export interface RetagRequest {
  path: string;
  line: string;
  tag: string;
}

export interface MoveLineResponse extends WriteResult {
  into: string;
  line: string;
}
