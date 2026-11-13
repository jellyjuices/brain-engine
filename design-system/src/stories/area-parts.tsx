import type { CSSProperties } from 'react'
import { areaKeys } from '../../tokens/areas.ts'
import { Chip } from '../components/chip/chip.tsx'
import { AreaShape } from '../components/area-shape/area-shape.tsx'
import { areaVar, mixGlow, mixGradient, mixSurface } from '../lib/area-mix.ts'

export const label: CSSProperties = { margin: 0, fontFamily: 'var(--font-number)', fontSize: 'var(--font-size-body-xs)', color: 'var(--text-secondary)' }

export const name = (areas: string[]) => areas.map((a) => areaKeys[a].label).join(' + ')

export const KeyRow = ({ slug }: { slug: string }) => (
  <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <AreaShape areas={[slug]} size="sm" />
      <strong>{areaKeys[slug].label}</strong>
      <span style={label}>hue {areaKeys[slug].hue}</span>
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-2xs)' }}>
      {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
        <div key={step} title={`--color-area-${slug}-${step}`} style={{ flex: 1, height: 'var(--space-xl)', borderRadius: 'var(--radius-sm)', background: `var(--color-area-${slug}-${step})` }} />
      ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-input)', background: `linear-gradient(${areaVar(slug, 'surface')}, ${areaVar(slug, 'surface')}), var(--background-secondary)` }}>
      <span style={{ color: areaVar(slug, 'text'), fontWeight: 'var(--font-weight-semibold)' }}>Area text</span>
      <span>Body text</span>
      <Chip label={areaKeys[slug].label} areas={[slug]} />
    </div>
  </div>
)

export const MixCell = ({ areas }: { areas: string[] }) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      display: 'grid',
      gap: 'var(--space-sm)',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-card)',
      border: 'var(--size-hair) solid var(--border-primary)',
      background: `${mixSurface(areas)}, var(--background-secondary)`,
    }}
  >
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, background: mixGlow(areas), maskImage: 'var(--glow-corner-mask)', opacity: 'var(--glow-corner-opacity)' }} />
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, backgroundImage: 'var(--texture-noise)', opacity: 'var(--opacity-noise-text)' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <AreaShape areas={areas} />
      <strong style={{ fontSize: 'var(--font-size-body-sm)' }}>{name(areas)}</strong>
    </div>
    <div style={{ height: 'var(--size-bar)', borderRadius: 'var(--radius-control)', background: mixGradient(areas, 'fill', 90) }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <Chip label="Tag" areas={areas} />
      <span style={{ ...label, flex: 1 }}>muted text</span>
      <AreaShape areas={areas} size="sm" />
    </div>
  </div>
)
