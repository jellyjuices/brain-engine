import { areaSlugs } from "./areas.ts";
import { noise } from "./primitives.ts";

export type Mix = { mix: string; amount: string };
export type Value = string | Mix;
type Pair = { dark: Value; light: Value };

const pair = (dark: Value, light: Value): Pair => ({ dark, light });
const tint = (token: string, amount: string): Mix => ({ mix: token, amount });

export const themed: Record<string, Pair> = {
  "background-primary": pair("color-neutral-900", "color-neutral-0"),
  "background-secondary": pair("color-neutral-800", "color-neutral-100"),
  "background-raised": pair("color-neutral-800", "color-neutral-0"),
  "background-hover": pair(tint("text-primary", "8%"), tint("text-primary", "8%")),
  "background-pressed": pair(tint("text-primary", "15%"), tint("text-primary", "15%")),
  "background-disabled": pair("color-neutral-700", "color-neutral-200"),
  "background-accent": pair("color-seafoam-300", "color-seafoam-700"),
  "background-accent-hover": pair(tint("text-on-accent", "14%"), tint("color-neutral-900", "14%")),
  "background-accent-pressed": pair(
    tint("text-on-accent", "24%"),
    tint("color-neutral-900", "24%"),
  ),
  "background-accent-soft": pair(
    tint("color-seafoam-300", "16%"),
    tint("color-seafoam-400", "16%"),
  ),
  "background-accent-soft-hover": pair(tint("text-accent", "8%"), tint("color-seafoam-400", "16%")),
  "background-inverse": pair("color-neutral-100", "color-neutral-900"),
  "background-check": pair("color-yellow-900", "color-yellow-100"),
  "background-scrim": pair(tint("color-neutral-900", "60%"), tint("color-neutral-900", "35%")),
  "text-primary": pair("color-neutral-100", "color-neutral-900"),
  "text-secondary": pair("color-neutral-400", "color-neutral-600"),
  "text-disabled": pair("color-neutral-500", "color-neutral-500"),
  "text-accent": pair("color-seafoam-300", "color-seafoam-700"),
  "text-on-accent": pair("color-seafoam-900", "color-neutral-0"),
  "text-inverse": pair("color-neutral-900", "color-neutral-100"),
  "text-inverse-accent": pair("color-seafoam-700", "color-seafoam-300"),
  "text-tag": pair("color-neutral-200", "color-neutral-700"),
  "text-danger": pair("color-coral-300", "color-coral-700"),
  "border-primary": pair("color-neutral-700", "color-neutral-200"),
  "border-strong": pair("color-neutral-500", "color-neutral-500"),
  "border-focus": pair("color-seafoam-300", "color-seafoam-700"),
  "status-late": pair("color-amber-300", "color-amber-700"),
  "status-done": pair("color-seafoam-400", "color-seafoam-600"),
  "status-check": pair("color-yellow-300", "color-yellow-700"),
  "status-waiting": pair("color-sky-300", "color-sky-700"),
  "action-drop": pair("color-coral-400", "color-coral-700"),
  "action-ink": pair("color-neutral-900", "color-neutral-0"),
  "progress-fill-start": pair("color-seafoam-400", "color-seafoam-600"),
  "progress-fill-end": pair("color-seafoam-200", "color-seafoam-400"),
  "toast-success": pair("color-seafoam-700", "color-seafoam-300"),
  "toast-error": pair("color-coral-600", "color-coral-300"),
  "toast-warning": pair("color-amber-700", "color-amber-300"),
  "toast-info": pair("color-sky-600", "color-sky-300"),
  "toast-neutral": pair("color-neutral-600", "color-neutral-400"),
  "toast-icon": pair("color-neutral-0", "color-neutral-900"),
  "glow-corner-start": pair("color-seafoam-500", "color-seafoam-300"),
  "glow-corner-end": pair("color-seafoam-200", "color-seafoam-100"),
  "glow-corner-opacity": pair("0.38", "0.5"),
  "texture-noise": pair(noise(1, "0 0 0.09 0.18"), noise(0, "0 0 0.06 0.12")),
  "shadow-raised": pair(
    "0 12px 32px color-mix(in oklch, var(--color-neutral-900) 50%, transparent)",
    "0 12px 32px color-mix(in oklch, var(--color-neutral-900) 16%, transparent)",
  ),
};

const areaRoles = (slug: string): Record<string, Pair> => {
  const step = (n: number) => `color-area-${slug}-${n}`;
  return {
    [`area-${slug}-accent`]: pair(step(300), step(700)),
    [`area-${slug}-fill`]: pair(step(400), step(600)),
    [`area-${slug}-text`]: pair(step(200), step(800)),
    [`area-${slug}-glow`]: pair(step(600), step(300)),
  };
};

for (const slug of areaSlugs) Object.assign(themed, areaRoles(slug));

export const reducedMotion = ["motion-fast", "motion-slow", "motion-pop"];

export const surface = (slug: string): Mix => tint(`area-${slug}-accent`, "16%");

type Check = { label: string; fg: string; bg: Value[]; min: number };
const c = (label: string, fg: string, bg: Value | Value[], min = 4.5): Check => ({
  label,
  fg,
  bg: Array.isArray(bg) ? bg : [bg],
  min,
});

export const contrastPairs: Check[] = [
  c("Body text on page", "text-primary", "background-primary"),
  c("Body text on card", "text-primary", "background-secondary"),
  c("Body text on hover", "text-primary", ["background-secondary", "background-pressed"]),
  c("Muted text on page", "text-secondary", "background-primary"),
  c("Muted text on card", "text-secondary", "background-secondary"),
  c("Muted text on hover", "text-secondary", ["background-secondary", "background-pressed"]),
  c("Accent text on page", "text-accent", "background-primary"),
  c("Accent text on card", "text-accent", "background-secondary"),
  c("Primary button", "text-on-accent", "background-accent"),
  c("Primary button hover", "text-on-accent", ["background-accent", "background-accent-hover"]),
  c("Primary button pressed", "text-on-accent", ["background-accent", "background-accent-pressed"]),
  c("Secondary button, banner", "text-accent", ["background-secondary", "background-accent-soft"]),
  c("Secondary button hover", "text-accent", [
    "background-secondary",
    "background-accent-soft",
    "background-accent-soft-hover",
  ]),
  c("Tag chip on card", "text-tag", ["background-secondary", tint("text-primary", "9%")]),
  c("Tag chip on page", "text-tag", ["background-primary", tint("text-primary", "9%")]),
  c("Check chip", "status-check", "background-check"),
  c("Late date on page", "status-late", "background-primary"),
  c("Late date on card", "status-late", "background-secondary"),
  c("Waiting mark on page", "status-waiting", "background-primary"),
  c("Waiting mark on card", "status-waiting", "background-secondary"),
  c("Waiting mark on panel", "status-waiting", "background-raised"),
  c("Muted text on panel", "text-secondary", "background-raised"),
  c("Bar fill on card", "progress-fill-start", "background-secondary", 3),
  c("Danger text on menu", "text-danger", "background-raised"),
  c("Toast text", "text-inverse", "background-inverse"),
  c("Toast button", "text-inverse-accent", "background-inverse"),
  c("Toast button pressed", "text-inverse-accent", [
    "background-inverse",
    tint("text-inverse", "15%"),
  ]),
  c("Swipe action: sort", "action-ink", "background-accent"),
  c("Swipe action: drop", "action-ink", "action-drop"),
  ...["success", "error", "warning", "info", "neutral"].flatMap((v) => [
    c(`Toast ${v} shape on toast`, `toast-${v}`, "background-inverse", 3),
    c(`Toast ${v} icon on shape`, "toast-icon", `toast-${v}`, 3),
  ]),
  c("Input border, tick box", "border-strong", "background-secondary", 3),
  c("Input border on page", "border-strong", "background-primary", 3),
  c("Focus ring on page", "border-focus", "background-primary", 3),
  c("Focus ring on card", "border-focus", "background-secondary", 3),
  c("Done tick on card", "status-done", "background-secondary", 3),
  c(
    "Bar fill on track",
    "progress-fill-start",
    ["background-secondary", tint("text-primary", "10%")],
    3,
  ),
  ...areaSlugs.flatMap((a) => [
    c(`${a}: area text on its surface`, `area-${a}-text`, ["background-secondary", surface(a)]),
    c(`${a}: body text on its surface`, "text-primary", ["background-secondary", surface(a)]),
    c(`${a}: muted text on its surface`, "text-secondary", ["background-secondary", surface(a)]),
    c(`${a}: accent on card`, `area-${a}-accent`, "background-secondary", 3),
    c(
      `${a}: ring fill on track`,
      `area-${a}-fill`,
      ["background-secondary", tint("text-primary", "10%")],
      3,
    ),
  ]),
];
