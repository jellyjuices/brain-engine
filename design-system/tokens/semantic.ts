import { areaSlugs } from './areas.ts'

export type Mix = { mix: string; amount: string }
export type Value = string | Mix
type Pair = { dark: Value; light: Value }

const pair = (dark: Value, light: Value): Pair => ({ dark, light })
const tint = (token: string, amount: string): Mix => ({ mix: token, amount })

export const themed: Record<string, Pair> = {
  'background-primary': pair('color-neutral-900', 'color-neutral-0'),
  'background-secondary': pair('color-neutral-800', 'color-neutral-100'),
  'background-tertiary': pair('color-neutral-700', 'color-neutral-200'),
  'background-raised': pair('color-neutral-800', 'color-neutral-0'),
  'background-hover': pair(tint('text-primary', 'mix-hover'), tint('text-primary', 'mix-hover')),
  'background-pressed': pair(tint('text-primary', 'mix-pressed'), tint('text-primary', 'mix-pressed')),
  'background-disabled': pair('color-neutral-700', 'color-neutral-200'),
  'background-accent': pair('color-seafoam-300', 'color-seafoam-700'),
  'background-accent-hover': pair(tint('text-on-accent', 'mix-accent-hover'), tint('color-neutral-900', 'mix-accent-hover')),
  'background-accent-pressed': pair(tint('text-on-accent', 'mix-accent-pressed'), tint('color-neutral-900', 'mix-accent-pressed')),
  'background-accent-soft': pair(tint('color-seafoam-300', 'mix-soft'), tint('color-seafoam-400', 'mix-soft')),
  'background-accent-soft-hover': pair(tint('text-accent', 'mix-hover'), tint('color-seafoam-400', 'mix-soft')),
  'background-inverse': pair('color-neutral-100', 'color-neutral-900'),
  'background-inverse-hover': pair(tint('text-inverse', 'mix-hover'), tint('text-inverse', 'mix-hover')),
  'background-inverse-pressed': pair(tint('text-inverse', 'mix-pressed'), tint('text-inverse', 'mix-pressed')),
  'background-tag': pair(tint('text-primary', 'mix-tag'), tint('text-primary', 'mix-tag')),
  'background-check': pair('color-yellow-900', 'color-yellow-100'),
  'background-scrim': pair(tint('color-neutral-900', 'mix-scrim-dark'), tint('color-neutral-900', 'mix-scrim-light')),
  'text-primary': pair('color-neutral-100', 'color-neutral-900'),
  'text-secondary': pair('color-neutral-400', 'color-neutral-600'),
  'text-disabled': pair('color-neutral-500', 'color-neutral-500'),
  'text-accent': pair('color-seafoam-300', 'color-seafoam-700'),
  'text-on-accent': pair('color-seafoam-900', 'color-neutral-0'),
  'text-inverse': pair('color-neutral-900', 'color-neutral-100'),
  'text-inverse-accent': pair('color-seafoam-700', 'color-seafoam-300'),
  'text-tag': pair('color-neutral-200', 'color-neutral-700'),
  'text-number': pair('color-seafoam-300', 'color-seafoam-700'),
  'text-danger': pair('color-coral-300', 'color-coral-700'),
  'border-primary': pair('color-neutral-700', 'color-neutral-200'),
  'border-strong': pair('color-neutral-500', 'color-neutral-500'),
  'border-focus': pair('color-seafoam-300', 'color-seafoam-700'),
  'border-selected': pair('color-seafoam-300', 'color-seafoam-700'),
  'status-late': pair('color-amber-300', 'color-amber-700'),
  'status-done': pair('color-seafoam-400', 'color-seafoam-600'),
  'status-check': pair('color-yellow-300', 'color-yellow-700'),
  'action-sort': pair('color-seafoam-300', 'color-seafoam-700'),
  'action-drop': pair('color-coral-400', 'color-coral-700'),
  'action-ink': pair('color-neutral-900', 'color-neutral-0'),
  'progress-track': pair('color-neutral-700', 'color-neutral-200'),
  'progress-fill-start': pair('color-seafoam-400', 'color-seafoam-600'),
  'progress-fill-end': pair('color-seafoam-200', 'color-seafoam-400'),
  'plus-fill': pair('color-seafoam-300', 'color-seafoam-700'),
  'plus-ink': pair('color-seafoam-900', 'color-neutral-0'),
  'toast-success': pair('color-seafoam-700', 'color-seafoam-300'),
  'toast-error': pair('color-coral-600', 'color-coral-300'),
  'toast-warning': pair('color-amber-700', 'color-amber-300'),
  'toast-info': pair('color-sky-600', 'color-sky-300'),
  'toast-neutral': pair('color-neutral-600', 'color-neutral-400'),
  'toast-icon': pair('color-neutral-0', 'color-neutral-900'),
  'glow-corner-start': pair('color-seafoam-500', 'color-seafoam-300'),
  'glow-corner-end': pair('color-seafoam-200', 'color-seafoam-100'),
  'glow-corner-opacity': pair('opacity-glow-dark', 'opacity-glow-light'),
  'texture-noise': pair('texture-noise-dark', 'texture-noise-light'),
  'shadow-raised': pair('shadow-md-dark', 'shadow-md-light'),
  'shadow-halo': pair('shadow-halo-dark', 'shadow-halo-light'),
}

const areaRoles = (slug: string): Record<string, Pair> => {
  const step = (n: number) => `color-area-${slug}-${n}`
  return {
    [`area-${slug}-accent`]: pair(step(300), step(700)),
    [`area-${slug}-fill`]: pair(step(400), step(600)),
    [`area-${slug}-text`]: pair(step(200), step(800)),
    [`area-${slug}-surface`]: pair(tint(step(300), 'mix-soft'), tint(step(400), 'mix-soft')),
    [`area-${slug}-glow`]: pair(step(600), step(300)),
  }
}

for (const slug of areaSlugs) Object.assign(themed, areaRoles(slug))

export const areaRoleNames = ['accent', 'fill', 'text', 'surface', 'glow'] as const

export const shared: Record<string, string> = {
  'font-display': 'font-family-display',
  'font-body': 'font-family-body',
  'font-number': 'font-family-number',
  'motion-fast': 'motion-duration-fast',
  'motion-slow': 'motion-duration-slow',
  'motion-pop': 'motion-duration-pop',
  'motion-easing': 'motion-easing-standard',
  'radius-control': 'radius-full',
  'radius-input': 'radius-md',
  'radius-card': 'radius-lg',
  'radius-sheet': 'radius-xl',
  'shape-plus': 'shape-cookie',
  'shape-toast-success': 'shape-cookie',
  'shape-toast-error': 'shape-burst',
  'shape-toast-warning': 'shape-triad',
  'shape-toast-info': 'shape-blossom',
  'shape-toast-neutral': 'shape-squircle',
  'shape-kind-todo': 'shape-scallop',
  'shape-kind-journal': 'shape-pebble',
  'shape-kind-person': 'shape-flower',
  'shape-kind-place': 'shape-clover',
  'shape-kind-thing': 'shape-puff',
  'shape-kind-file': 'shape-hexagon',
  'shape-kind-intake': 'shape-pentagon',
  'shape-kind-other': 'shape-circle',
}

export const composed: Record<string, string> = {
  'glow-corner':
    'conic-gradient(from 200deg at 100% 0%, var(--glow-corner-start), var(--glow-corner-end), var(--glow-corner-start))',
  'glow-corner-mask': 'radial-gradient(circle at 100% 0%, #000 0%, rgb(0 0 0 / 0.5) 35%, transparent 70%)',
  'texture-noise-mask': 'radial-gradient(circle at 100% 0%, #000, transparent 70%)',
  'gradient-progress': 'linear-gradient(90deg, var(--progress-fill-start), var(--progress-fill-end))',
}

export const reducedMotion = ['motion-fast', 'motion-slow', 'motion-pop']

type Check = { label: string; fg: string; bg: string[]; min: number }
const c = (label: string, fg: string, bg: string | string[], min = 4.5): Check => ({
  label,
  fg,
  bg: Array.isArray(bg) ? bg : [bg],
  min,
})

export const contrastPairs: Check[] = [
  c('Body text on page', 'text-primary', 'background-primary'),
  c('Body text on card', 'text-primary', 'background-secondary'),
  c('Body text on hover', 'text-primary', ['background-secondary', 'background-pressed']),
  c('Muted text on page', 'text-secondary', 'background-primary'),
  c('Muted text on card', 'text-secondary', 'background-secondary'),
  c('Muted text on hover', 'text-secondary', ['background-secondary', 'background-pressed']),
  c('Accent text on page', 'text-accent', 'background-primary'),
  c('Accent text on card', 'text-accent', 'background-secondary'),
  c('Primary button', 'text-on-accent', 'background-accent'),
  c('Primary button hover', 'text-on-accent', ['background-accent', 'background-accent-hover']),
  c('Primary button pressed', 'text-on-accent', ['background-accent', 'background-accent-pressed']),
  c('Secondary button, banner', 'text-accent', ['background-secondary', 'background-accent-soft']),
  c('Secondary button hover', 'text-accent', ['background-secondary', 'background-accent-soft', 'background-accent-soft-hover']),
  c('Tag chip on card', 'text-tag', ['background-secondary', 'background-tag']),
  c('Tag chip on page', 'text-tag', ['background-primary', 'background-tag']),
  c('Check chip', 'status-check', 'background-check'),
  c('Late date on page', 'status-late', 'background-primary'),
  c('Late date on card', 'status-late', 'background-secondary'),
  c('Danger text on menu', 'text-danger', 'background-raised'),
  c('Toast text', 'text-inverse', 'background-inverse'),
  c('Toast button', 'text-inverse-accent', 'background-inverse'),
  c('Toast button pressed', 'text-inverse-accent', ['background-inverse', 'background-inverse-pressed']),
  c('Swipe action: sort', 'action-ink', 'action-sort'),
  c('Swipe action: drop', 'action-ink', 'action-drop'),
  c('Goal number on card', 'text-number', 'background-secondary', 3),
  c('Plus icon on shape', 'plus-ink', 'plus-fill', 3),
  ...['success', 'error', 'warning', 'info', 'neutral'].flatMap((v) => [
    c(`Toast ${v} shape on toast`, `toast-${v}`, 'background-inverse', 3),
    c(`Toast ${v} icon on shape`, 'toast-icon', `toast-${v}`, 3),
  ]),
  c('Input border, tick box', 'border-strong', 'background-secondary', 3),
  c('Input border on page', 'border-strong', 'background-primary', 3),
  c('Focus ring on page', 'border-focus', 'background-primary', 3),
  c('Focus ring on card', 'border-focus', 'background-secondary', 3),
  c('Done tick on card', 'status-done', 'background-secondary', 3),
  c('Bar fill on track', 'progress-fill-start', 'progress-track', 3),
  ...areaSlugs.flatMap((a) => [
    c(`${a}: area text on its surface`, `area-${a}-text`, ['background-secondary', `area-${a}-surface`]),
    c(`${a}: body text on its surface`, 'text-primary', ['background-secondary', `area-${a}-surface`]),
    c(`${a}: muted text on its surface`, 'text-secondary', ['background-secondary', `area-${a}-surface`]),
    c(`${a}: accent on card`, `area-${a}-accent`, 'background-secondary', 3),
    c(`${a}: ring fill on track`, `area-${a}-fill`, 'progress-track', 3),
  ]),
]
