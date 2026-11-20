export interface PendingFile {
  title: string;
  text: string;
}

let pending: PendingFile | null = null;

export function holdFile(file: PendingFile) {
  pending = file;
}

export function heldFile(): PendingFile | null {
  return pending;
}

export function dropHeldFile() {
  pending = null;
}
