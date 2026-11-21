import type { BuildSpec, RelationInput, TodoInput } from "../../capture/build.ts";
import { HttpError } from "../server-auth.ts";
import { safeNotePath, text, textList } from "../server-context.ts";

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function fieldsOf(raw: unknown): BuildSpec["fields"] {
  if (raw === undefined) return undefined;
  if (!isObject(raw)) throw new HttpError(400, `"fields" must be an object.`);
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (Array.isArray(v) && v.every((x) => typeof x === "string")) out[k] = v;
    else throw new HttpError(400, `"fields" ${k} must be text or a list of text.`);
  }
  return out;
}

function sectionsOf(raw: unknown): BuildSpec["sections"] {
  if (raw === undefined) return undefined;
  if (!isObject(raw)) throw new HttpError(400, `"sections" must be an object of heading to lines.`);
  return Object.fromEntries(Object.entries(raw).map(([heading, lines]) => [heading, textList(lines, `sections ${heading}`) ?? []]));
}

function listOf(raw: unknown, name: string): unknown[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) throw new HttpError(400, `"${name}" must be a list.`);
  return raw;
}

function relationsOf(raw: unknown): RelationInput[] | undefined {
  return listOf(raw, "relations")?.map((r) => {
    if (!isObject(r)) throw new HttpError(400, `"relations" must be a list of objects.`);
    return { to: safeNotePath(text(r.to, "to")!, true), role: text(r.role, "role", false), time: text(r.time, "time", false) };
  });
}

function todosOf(raw: unknown): TodoInput[] | undefined {
  return listOf(raw, "todos")?.map((t) => {
    if (typeof t === "string") return { text: t };
    if (!isObject(t)) throw new HttpError(400, `"todos" must be a list of text or objects.`);
    const toward = text(t.toward, "toward", false);
    return { text: text(t.text, "text")!, when: text(t.when, "when", false), ...(toward && { toward: safeNotePath(toward, true) }) };
  });
}

export function specParts(body: Record<string, unknown>): Pick<BuildSpec, "fields" | "areas" | "parent" | "sections" | "relations" | "todos"> {
  const parent = text(body.parent, "parent", false);
  return {
    fields: fieldsOf(body.fields),
    areas: textList(body.areas, "areas"),
    ...(parent && { parent: parent.endsWith(".md") ? safeNotePath(parent, true) : parent }),
    sections: sectionsOf(body.sections),
    relations: relationsOf(body.relations),
    todos: todosOf(body.todos),
  };
}
