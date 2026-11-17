import type { CSSProperties, ReactNode } from 'react'
import { color, contrastPairs, font, primitiveNames, radius, shape, shared, space, themed } from '../../tokens/index.ts'
import { ratio } from '../../tokens/contrast.ts'
import { hexOf, isColour, type Mode } from '../../tokens/resolve.ts'
import type { Value } from '../../tokens/semantic.ts'

const label: CSSProperties = { fontFamily: 'var(--font-number)', fontSize: 'var(--font-size-body-xs)', color: 'var(--text-secondary)' }
const grid: CSSProperties = { display: 'grid', gap: 'var(--space-lg)' }
const cell: CSSProperties = { padding: 'var(--space-xs) var(--space-sm)', borderBottom: 'var(--size-hair) solid var(--border-primary)', textAlign: 'left' }

export const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ ...grid, marginBottom: 'var(--space-3xl)' }}>
    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-regular)', fontSize: 'var(--font-size-display-lg)' }}>{title}</h2>
    {children}
  </section>
)

export const Ramps = () => (
  <Block title="Colour ramps">
    {Object.entries(color).filter(([name]) => name !== 'area').map(([name, ramp]) => (
      <div key={name}>
        <p style={label}>{name}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          {Object.entries(ramp).map(([step, hex]) => (
            <div key={step} style={{ width: 'var(--size-tabbar)' }}>
              <div style={{ height: 'var(--size-control)', borderRadius: 'var(--radius-sm)', background: `var(--color-${name}-${step})`, border: 'var(--size-hair) solid var(--border-primary)' }} />
              <div style={label}>{step}</div>
              <div style={label}>{hex}</div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </Block>
)

const sample = { display: 'Due today', body: 'Send the sample invoice', number: '62%' } as const

export const TypeScale = () => (
  <Block title="Type">
    {(Object.keys(font.size) as (keyof typeof font.size)[]).map((scale) => (
      <div key={scale} style={grid}>
        <p style={label}>{scale}: {font.family[scale]}</p>
        {Object.entries(font.size[scale]).map(([step, rem]) => (
          <div key={step} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-lg)' }}>
            <span style={{ ...label, width: 'var(--size-tabbar)', flex: 'none' }}>{step} {rem}</span>
            <span style={{ fontFamily: `var(--font-${scale})`, fontSize: `var(--font-size-${scale}-${step})`, lineHeight: 'var(--font-leading-tight)' }}>
              {sample[scale]}
            </span>
          </div>
        ))}
      </div>
    ))}
  </Block>
)

export const Spacing = () => (
  <Block title="Spacing">
    {Object.entries(space).map(([step, px]) => (
      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <span style={{ ...label, width: 'var(--size-plus)' }}>{step} {px}</span>
        <span style={{ width: `var(--space-${step})`, height: 'var(--space-lg)', background: 'var(--background-accent)', borderRadius: 'var(--radius-sm)' }} />
      </div>
    ))}
  </Block>
)

export const Shapes = () => (
  <Block title="Radius and shapes">
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xl)' }}>
      {Object.keys(radius).map((step) => (
        <div key={step}>
          <div style={{ width: 'var(--size-tabbar)', height: 'var(--size-tabbar)', background: 'var(--background-accent-soft)', border: 'var(--size-hair) solid var(--border-strong)', borderRadius: `var(--radius-${step})` }} />
          <p style={label}>radius-{step}</p>
        </div>
      ))}
      {Object.keys(shape).map((name) => (
        <div key={name}>
          <div style={{ width: 'var(--size-tabbar)', height: 'var(--size-tabbar)', background: 'var(--background-accent)', clipPath: `var(--shape-${name})` }} />
          <p style={label}>shape-{name}</p>
        </div>
      ))}
    </div>
  </Block>
)

const show = (v: Value) => (typeof v === 'string' ? v : `${v.mix} at ${primitiveNames[v.amount]}`)
const ratioFor = (fg: string, bg: string[], mode: Mode) => ratio(hexOf([...bg, fg], mode), hexOf(bg, mode)).toFixed(2)

export const Semantic = () => (
  <Block title="Semantic tokens">
    <table style={{ borderCollapse: 'collapse', fontSize: 'var(--font-size-body-sm)' }}>
      <thead><tr><th style={cell}>Token</th><th style={cell}>Now</th><th style={cell}>Dark</th><th style={cell}>Light</th></tr></thead>
      <tbody>
        {Object.entries(themed).map(([name, p]) => (
          <tr key={name}>
            <td style={cell}><code>--{name}</code></td>
            <td style={cell}>{isColour(name) && <span style={{ display: 'inline-block', width: 'var(--space-xl)', height: 'var(--space-lg)', borderRadius: 'var(--radius-sm)', background: `var(--${name})`, border: 'var(--size-hair) solid var(--border-primary)' }} />}</td>
            <td style={{ ...cell, ...label }}>{show(p.dark)}</td>
            <td style={{ ...cell, ...label }}>{show(p.light)}</td>
          </tr>
        ))}
        {Object.entries(shared).map(([name, r]) => (
          <tr key={name}><td style={cell}><code>--{name}</code></td><td style={cell} /><td style={{ ...cell, ...label }} colSpan={2}>{r}</td></tr>
        ))}
      </tbody>
    </table>
    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-regular)' }}>Text pairs (WCAG 2.1 AA)</h3>
    <table style={{ borderCollapse: 'collapse', fontSize: 'var(--font-size-body-sm)' }}>
      <thead><tr><th style={cell}>Sample</th><th style={cell}>Pair</th><th style={cell}>Dark</th><th style={cell}>Light</th><th style={cell}>Needs</th></tr></thead>
      <tbody>
        {contrastPairs.map((p) => (
          <tr key={p.label}>
            <td style={cell}><span style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', background: p.bg.map((b) => `linear-gradient(var(--${b}), var(--${b}))`).join(', '), color: `var(--${p.fg})` }}>Aa</span></td>
            <td style={cell}>{p.label}<br /><code style={label}>{p.fg} / {p.bg.join(' + ')}</code></td>
            <td style={{ ...cell, ...label }}>{ratioFor(p.fg, p.bg, 'dark')}:1</td>
            <td style={{ ...cell, ...label }}>{ratioFor(p.fg, p.bg, 'light')}:1</td>
            <td style={{ ...cell, ...label }}>{p.min}:1</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Block>
)
