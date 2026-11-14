let asked = false;

export function askPersist(): void {
  if (asked) return;
  asked = true;
  const storage = typeof navigator === "undefined" ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return;
  void storage
    .persisted()
    .then((granted) => granted || storage.persist())
    .catch(() => undefined);
}
