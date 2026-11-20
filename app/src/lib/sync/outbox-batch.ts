import type { OutboxItem } from "./outbox.ts";

export async function enqueueAll(writes: (() => Promise<OutboxItem>)[]): Promise<OutboxItem> {
  let last: OutboxItem | undefined;
  for (const write of writes) last = await write();
  if (!last) throw new Error("Nothing to send");
  return last;
}
