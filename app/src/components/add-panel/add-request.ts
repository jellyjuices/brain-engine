export interface AddRequest {
  into?: string;
  text?: string;
}

const EVENT = "brain:add-request";
let pending: AddRequest | null = null;

export function requestAdd(request: AddRequest = {}) {
  pending = request;
  dispatchEvent(new Event(EVENT));
}

export function takeAddRequest(): AddRequest | null {
  const request = pending;
  pending = null;
  return request;
}

export function onAddRequest(fn: () => void): () => void {
  addEventListener(EVENT, fn);
  return () => removeEventListener(EVENT, fn);
}
