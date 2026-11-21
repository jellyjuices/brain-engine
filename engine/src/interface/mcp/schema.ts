export type Json = Record<string, unknown>;

const REQUIRED = Symbol("required");
type Req = Json & { readonly [REQUIRED]: true };
type Opt = Json & { readonly [REQUIRED]?: never };

type Props<T> = { [K in keyof T]-?: object extends Pick<T, K> ? Opt : Req };

export interface Input {
  schema: Json;
  rest?: string;
}

export const req = (p: Json): Req => ({ ...p, [REQUIRED]: true }) as Req;
export const str = (description?: string): Opt => ({ type: "string", ...(description && { description }) });
export const int = (description?: string): Opt => ({ type: "integer", minimum: 1, ...(description && { description }) });
export const strs = (description?: string): Opt => ({ type: "array", items: { type: "string" }, ...(description && { description }) });
export const oneOf = (values: readonly string[], description?: string): Opt => ({ type: "string", enum: [...values], ...(description && { description }) });

export function shape<T>(props: Props<T>): Opt {
  const entries = Object.entries(props) as [string, Json][];
  const required = entries.filter(([, p]) => (p as Req)[REQUIRED]).map(([k]) => k);
  const properties = Object.fromEntries(entries.map(([k, p]) => [k, Object.fromEntries(Object.entries(p))]));
  return { type: "object", properties, ...(required.length && { required }), additionalProperties: false };
}

export function obj<T>(props: Props<T>, rest?: keyof T & string): Input {
  return { schema: shape<T>(props), ...(rest && { rest }) };
}

export const NONE: Input = { schema: { type: "object", additionalProperties: false } };
