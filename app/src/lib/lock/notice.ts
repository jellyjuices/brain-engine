let notice: string | null = null;

export function setNotice(message: string | null) {
  notice = message;
}
export function takeNotice() {
  const n = notice;
  notice = null;
  return n;
}
