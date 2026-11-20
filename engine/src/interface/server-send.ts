import type { ServerResponse } from "node:http";

export class TextBody {
  readonly text: string;
  readonly type: string;
  constructor(text: string, type: string) {
    this.text = text;
    this.type = type;
  }
}

export function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const isText = body instanceof TextBody;
  const data = isText ? body.text : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": isText ? body.type : "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(data), ...headers });
  res.end(data);
}
