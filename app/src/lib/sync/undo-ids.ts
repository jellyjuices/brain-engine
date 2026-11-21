const KEEP = 20;
const undoIds = new Map<string, string>();

export function rememberUndoId(itemId: string, data: unknown) {
  if (!data || typeof data !== "object") return;
  const id = (data as { undo_id?: unknown }).undo_id;
  if (typeof id !== "string") return;
  undoIds.set(itemId, id);
  const oldest = undoIds.keys().next().value;
  if (undoIds.size > KEEP && oldest !== undefined) undoIds.delete(oldest);
}

export function hasUndoId(itemId: string): boolean {
  return undoIds.has(itemId);
}

export function takeUndoId(itemId: string): string | undefined {
  const id = undoIds.get(itemId);
  undoIds.delete(itemId);
  return id;
}
