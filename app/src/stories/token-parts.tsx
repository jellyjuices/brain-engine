import type { CSSProperties, ReactNode } from "react";
import { color, font, radius, shape, space } from "../../tokens/index.ts";

export const label: CSSProperties = {
  fontFamily: "var(--font-number)",
  fontSize: "var(--font-size-body-xs)",
  color: "var(--text-secondary)",
};
const grid: CSSProperties = { display: "grid", gap: "var(--space-lg)" };
export const cell: CSSProperties = {
  padding: "var(--space-xs) var(--space-sm)",
  borderBottom: "1px solid var(--border-primary)",
  textAlign: "left",
};

export const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ ...grid, marginBottom: "var(--space-3xl)" }}>
    <h2
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontWeight: "400",
        fontSize: "var(--font-size-display-lg)",
      }}
    >
      {title}
    </h2>
    {children}
  </section>
);

export const Ramps = () => (
  <Block title="Colour ramps">
    {Object.entries(color)
      .filter(([name]) => name !== "area")
      .map(([name, ramp]) => (
        <div key={name}>
          <p style={label}>{name}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
            {Object.entries(ramp).map(([step, hex]) => (
              <div key={step} style={{ width: "var(--layout-tabbar)" }}>
                <div
                  style={{
                    height: "var(--size-control)",
                    borderRadius: "var(--radius-sm)",
                    background: `var(--color-${name}-${step})`,
                    border: "1px solid var(--border-primary)",
                  }}
                />
                <div style={label}>{step}</div>
                <div style={label}>{hex}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
  </Block>
);

const sample = { display: "Due today", body: "Send the sample invoice", number: "62%" } as const;

export const TypeScale = () => (
  <Block title="Type">
    {(Object.keys(font.size) as (keyof typeof font.size)[]).map((scale) => (
      <div key={scale} style={grid}>
        <p style={label}>
          {scale}: {font.family[scale]}
        </p>
        {Object.entries(font.size[scale]).map(([step, rem]) => (
          <div
            key={step}
            style={{ display: "flex", alignItems: "baseline", gap: "var(--space-lg)" }}
          >
            <span style={{ ...label, width: "var(--layout-tabbar)", flex: "none" }}>
              {step} {rem}
            </span>
            <span
              style={{
                fontFamily: `var(--font-${scale})`,
                fontSize: `var(--font-size-${scale}-${step})`,
                lineHeight: "var(--font-leading-tight)",
              }}
            >
              {sample[scale]}
            </span>
          </div>
        ))}
      </div>
    ))}
  </Block>
);

export const Spacing = () => (
  <Block title="Spacing">
    {Object.entries(space).map(([step, px]) => (
      <div key={step} style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
        <span style={{ ...label, width: "58px" }}>
          {step} {px}
        </span>
        <span
          style={{
            width: `var(--space-${step})`,
            height: "var(--space-lg)",
            background: "var(--background-accent)",
            borderRadius: "var(--radius-sm)",
          }}
        />
      </div>
    ))}
  </Block>
);

export const Shapes = () => (
  <Block title="Radius and shapes">
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xl)" }}>
      {Object.keys(radius).map((step) => (
        <div key={step}>
          <div
            style={{
              width: "var(--layout-tabbar)",
              height: "var(--layout-tabbar)",
              background: "var(--background-accent-soft)",
              border: "1px solid var(--border-strong)",
              borderRadius: `var(--radius-${step})`,
            }}
          />
          <p style={label}>radius-{step}</p>
        </div>
      ))}
      {Object.keys(shape).map((name) => (
        <div key={name}>
          <div
            style={{
              width: "var(--layout-tabbar)",
              height: "var(--layout-tabbar)",
              background: "var(--background-accent)",
              clipPath: `var(--shape-${name})`,
            }}
          />
          <p style={label}>shape-{name}</p>
        </div>
      ))}
    </div>
  </Block>
);
