import { api } from "./api.ts";
import { enqueue, registerHandler } from "./outbox.ts";

interface RelationPayload {
  from: string;
  to: string;
  role?: string;
}

export function registerRelationWrites() {
  registerHandler("relation", (item) =>
    api("/api/relations", { body: item.payload as RelationPayload }),
  );
}

export function queueRelation(from: string, to: string, role?: string) {
  return enqueue<RelationPayload>("relation", { from, to, ...(role && { role }) });
}
