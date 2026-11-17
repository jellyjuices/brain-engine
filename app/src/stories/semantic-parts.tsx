import { contrastPairs, primitiveNames, shared, themed } from "../../tokens/index.ts";
import { ratio } from "../../tokens/contrast.ts";
import { hexOf, isColour, type Mode } from "../../tokens/resolve.ts";
import type { Value } from "../../tokens/semantic.ts";
import { Block, cell, label } from "./token-parts.tsx";

const show = (v: Value) => (typeof v === "string" ? v : `${v.mix} at ${primitiveNames[v.amount]}`);
const ratioFor = (fg: string, bg: string[], mode: Mode) =>
  ratio(hexOf([...bg, fg], mode), hexOf(bg, mode)).toFixed(2);

export const Semantic = () => (
  <Block title="Semantic tokens">
    <table style={{ borderCollapse: "collapse", fontSize: "var(--font-size-body-sm)" }}>
      <thead>
        <tr>
          <th style={cell}>Token</th>
          <th style={cell}>Now</th>
          <th style={cell}>Dark</th>
          <th style={cell}>Light</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(themed).map(([name, p]) => (
          <tr key={name}>
            <td style={cell}>
              <code>--{name}</code>
            </td>
            <td style={cell}>
              {isColour(name) && (
                <span
                  style={{
                    display: "inline-block",
                    width: "var(--space-xl)",
                    height: "var(--space-lg)",
                    borderRadius: "var(--radius-sm)",
                    background: `var(--${name})`,
                    border: "var(--size-hair) solid var(--border-primary)",
                  }}
                />
              )}
            </td>
            <td style={{ ...cell, ...label }}>{show(p.dark)}</td>
            <td style={{ ...cell, ...label }}>{show(p.light)}</td>
          </tr>
        ))}
        {Object.entries(shared).map(([name, r]) => (
          <tr key={name}>
            <td style={cell}>
              <code>--{name}</code>
            </td>
            <td style={cell} />
            <td style={{ ...cell, ...label }} colSpan={2}>
              {r}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <h3
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontWeight: "var(--font-weight-regular)",
      }}
    >
      Text pairs (WCAG 2.1 AA)
    </h3>
    <table style={{ borderCollapse: "collapse", fontSize: "var(--font-size-body-sm)" }}>
      <thead>
        <tr>
          <th style={cell}>Sample</th>
          <th style={cell}>Pair</th>
          <th style={cell}>Dark</th>
          <th style={cell}>Light</th>
          <th style={cell}>Needs</th>
        </tr>
      </thead>
      <tbody>
        {contrastPairs.map((p) => (
          <tr key={p.label}>
            <td style={cell}>
              <span
                style={{
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--radius-sm)",
                  background: p.bg
                    .map((b) => `linear-gradient(var(--${b}), var(--${b}))`)
                    .join(", "),
                  color: `var(--${p.fg})`,
                }}
              >
                Aa
              </span>
            </td>
            <td style={cell}>
              {p.label}
              <br />
              <code style={label}>
                {p.fg} / {p.bg.join(" + ")}
              </code>
            </td>
            <td style={{ ...cell, ...label }}>{ratioFor(p.fg, p.bg, "dark")}:1</td>
            <td style={{ ...cell, ...label }}>{ratioFor(p.fg, p.bg, "light")}:1</td>
            <td style={{ ...cell, ...label }}>{p.min}:1</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Block>
);
