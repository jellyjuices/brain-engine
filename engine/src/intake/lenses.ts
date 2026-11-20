// The "Know the owner" intake: stages, lens notes in me/, threads in threads/, and progress.

import { existsSync, readFileSync } from "node:fs";
import YAML from "yaml";
import { join } from "node:path";
import { type Meta, type Note, nowStamp, str, today } from "../core/notes.ts";
import { readNote, writeAtomic, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
export const THREADS_HEADING = "# Open threads";

export interface Lens {
  slug: string;
  title: string;
  description: string;
  privacy: Privacy;
  /** Where this lens stops and the areas start. */
  boundary: string;
}

export const PRIVACY = ["full", "headline", "skip"] as const;
export type Privacy = (typeof PRIVACY)[number];
export const THREAD_STATUS = ["open", "talked", "parked", "closed"] as const;
export type ThreadStatus = (typeof THREAD_STATUS)[number];

/**
 * Lenses are about who the owner is and how they feel. Areas (areas/) are about what they handle.
 * Each lens says where its line with the areas sits, so one fact lives in one place.
 * A lens note is made the first time the intake saves to it (or sets its privacy). Until then it does not exist.
 * Wellbeing and identity start at headline until the owner changes it in stage 0.
 */
export const LENSES: Lens[] = [
  { slug: "now", title: "Now", description: "What takes up room in my head, how each area rates from 1 to 10, and the setup of my life.", privacy: "full", boundary: "Ratings, load and setup. To-dos go in the areas." },
  { slug: "day", title: "A real day", description: "What a real day looks like, part by part: where, with whom, and how much energy.", privacy: "full", boundary: "Patterns of a day. Schedules and to-dos go in the areas." },
  { slug: "people", title: "People", description: "The people and groups around me, and which ones give or take energy.", privacy: "full", boundary: "The map and how people affect me. Things to do with people go in areas/relationships.md; one note per person goes in people/." },
  { slug: "values", title: "Values and strengths", description: "What matters most to me, what people come to me for, and which needs are low.", privacy: "full", boundary: "Lens only. No area holds this." },
  { slug: "wellbeing", title: "Wellbeing", description: "How my body and head are doing: sleep, energy, stress, moods, what calms me, how I cope.", privacy: "headline", boundary: "How I feel and cope. Appointments go in areas/health.md; training goes in areas/fitness.md." },
  { slug: "story", title: "Story", description: "My life as chapters, with a high point, a turning point and a theme.", privacy: "full", boundary: "Lens only. No area holds this." },
  { slug: "identity", title: "Identity", description: "The parts of who I am that matter day to day, and where they meet.", privacy: "headline", boundary: "Lens only. No area holds this." },
  { slug: "future", title: "Future", description: "Life going well in 1 and 5 years, and what is in the way.", privacy: "full", boundary: "The picture and what blocks it. Career steps go in areas/career.md; projects go in projects/." },
  { slug: "profile", title: "At a glance", description: "A short summary built from the other lens notes. The owner verifies every line.", privacy: "full", boundary: "Summary only. It links to other notes and repeats nothing at length." },
];

export interface Stage {
  n: number;
  key: string;
  name: string;
  lenses: string[];
}

export const STAGES: Stage[] = [
  { n: 0, key: "setup", name: "Set up", lenses: [] },
  { n: 1, key: "dump", name: "Brain dump", lenses: [] },
  { n: 2, key: "now", name: "Now", lenses: ["now"] },
  { n: 3, key: "day", name: "A real day", lenses: ["day"] },
  { n: 4, key: "people", name: "People", lenses: ["people"] },
  { n: 5, key: "context", name: "Context", lenses: ["now"] },
  { n: 6, key: "values", name: "Values", lenses: ["values"] },
  { n: 7, key: "body-and-mind", name: "Body and mind", lenses: ["wellbeing"] },
  { n: 8, key: "story", name: "Story", lenses: ["story"] },
  { n: 9, key: "identity", name: "Identity", lenses: ["identity"] },
  { n: 10, key: "future", name: "Future", lenses: ["future"] },
  { n: 11, key: "synthesis", name: "Synthesis", lenses: ["profile"] },
];

export const SETTINGS_PATH = "me/settings.yaml";
export const lensPath = (slug: string) => `me/${slug}.md`;
const lensBySlug = (slug: string) => LENSES.find((l) => l.slug === slug);

/** Find a stage by number, key, name or one of its lenses. */
export function findStage(q: string): Stage | undefined {
  const needle = q.toLowerCase().trim();
  return STAGES.find((s) => String(s.n) === needle || s.key === needle || s.name.toLowerCase() === needle || s.lenses.includes(needle));
}

export function needLens(slug: string): Lens {
  const lens = lensBySlug(slug);
  if (!lens) throw new Error(`unknown lens ${slug}. Use one of: ${LENSES.map((x) => x.slug).join(", ")}`);
  return lens;
}

/** Make a lens note if it does not exist yet. Returns its path. */
export function ensureLens(root: string, slug: string, by = "claude"): string {
  const lens = needLens(slug);
  const rel = lensPath(slug);
  if (existsSync(join(root, rel))) return rel;
  const stage = STAGES.find((s) => s.lenses.includes(slug));
  const meta: Meta = { type: "Lens", title: lens.title, description: lens.description, lens: slug };
  if (stage) meta.stage = stage.n;
  meta.privacy = lens.privacy;
  meta.tags = ["intake"];
  meta.generated = { by, at: nowStamp() };
  const body = [
    "# What we know",
    "",
    "_Nothing yet. Built only from the owner's own words. The owner approves each line._",
    "",
    `_Boundary: ${lens.boundary}_`,
    "",
    THREADS_HEADING,
    "",
    "# Intake log",
  ].join("\n");
  writeNote(root, rel, meta, body);
  log(root, `lens note made: ${rel}`);
  return rel;
}

/** The privacy level the owner set for a lens (from its note), or the default. */
export function lensPrivacy(root: string, slug: string): Privacy {
  const lens = needLens(slug);
  const rel = lensPath(slug);
  if (!existsSync(join(root, rel))) return lens.privacy;
  const privacy = str(readNote(root, rel).meta.privacy);
  return (PRIVACY as readonly string[]).includes(privacy ?? "") ? (privacy as Privacy) : lens.privacy;
}

/** Set how much to write down for one lens: full, headline or skip. */
export function setLensPrivacy(root: string, slug: string, level: string, by = "claude"): Note {
  needLens(slug);
  if (!(PRIVACY as readonly string[]).includes(level)) throw new Error(`privacy must be one of: ${PRIVACY.join(", ")}`);
  const rel = ensureLens(root, slug, by);
  const n = readNote(root, rel);
  const note = writeNote(root, rel, { ...n.meta, privacy: level, generated: { by, at: nowStamp() } }, n.body);
  log(root, `lens ${slug} privacy set to ${level}`);
  return note;
}

/** Intake settings live in me/settings.yaml: plain settings, not a note. */
export function readSettings(root: string): Meta {
  const full = join(root, SETTINGS_PATH);
  if (!existsSync(full)) return {};
  const data = YAML.parse(readFileSync(full, "utf8")) ?? {};
  return typeof data === "object" && !Array.isArray(data) ? (data as Meta) : {};
}

export function writeSettings(root: string, meta: Meta): void {
  const head = "# Intake settings. Stage 0 fills these in. The agent reads them at the start of every session.\n# stages_done is set by `brain intake done <stage>`. Do not edit it by hand.\n";
  writeAtomic(join(root, SETTINGS_PATH), head + YAML.stringify(meta, { lineWidth: 0 }));
}

export function stagesDone(meta: Meta): Record<string, string> {
  const d = meta.stages_done;
  return d && typeof d === "object" && !Array.isArray(d) ? (d as Record<string, string>) : {};
}

/** Mark a stage done in me/settings.yaml. */
export function markStageDone(root: string, q: string, _by = "claude"): Stage {
  const stage = findStage(q);
  if (!stage) throw new Error(`unknown stage ${q}. Use a number 0 to 11, a stage name or a lens.`);
  const meta = readSettings(root);
  writeSettings(root, { ...meta, stages_done: { ...stagesDone(meta), [stage.key]: today() } });
  log(root, `intake stage ${stage.n} (${stage.name}) done`);
  return stage;
}

/** Append one answer to a lens note, under a dated heading in "# Intake log". */
