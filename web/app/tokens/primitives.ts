import { shapes } from "./shapes.ts";
import { areaColours } from "./areas.ts";

const noise = (ink: number, alpha: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='0' intercept='${ink}'/><feFuncG type='linear' slope='0' intercept='${ink}'/><feFuncB type='linear' slope='0' intercept='${ink}'/><feFuncA type='table' tableValues='${alpha}'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )}")`;

const ramp = (v: string[]) =>
  Object.fromEntries(v.map((hex, i) => [String((i + 1) * 100), hex])) as Record<string, string>;

export const color = {
  neutral: {
    0: "#FFFFFF",
    ...ramp([
      "#F5F8F8",
      "#E5E9E8",
      "#CBCECE",
      "#AEB2B1",
      "#828585",
      "#575A5A",
      "#333636",
      "#1C1F1F",
      "#0E1111",
    ]),
  },
  seafoam: ramp([
    "#D4F2EA",
    "#A7E8D6",
    "#86D9C6",
    "#5FC4B0",
    "#3FA893",
    "#2A8C7A",
    "#1C6659",
    "#123F37",
    "#0F1A17",
  ]),
  amber: ramp([
    "#F6E1C2",
    "#F0CE9C",
    "#E9BC7E",
    "#D9A05A",
    "#BF8335",
    "#A06C1C",
    "#8A5A0B",
    "#6B4508",
    "#2E1E05",
  ]),
  yellow: ramp([
    "#F7EDC4",
    "#F3E1A3",
    "#F0D488",
    "#DDB95A",
    "#BF9A2E",
    "#977812",
    "#6E5200",
    "#534000",
    "#332B1C",
  ]),
  coral: ramp([
    "#F9DCD6",
    "#F3BDB2",
    "#EC9D8E",
    "#E07F6D",
    "#C9614F",
    "#A84A3A",
    "#8A3A2D",
    "#632A21",
    "#2E1714",
  ]),
  area: areaColours,
  sky: ramp([
    "#D9E8F5",
    "#B5D2EC",
    "#8FBBE2",
    "#6AA2D3",
    "#4C87BC",
    "#386E9E",
    "#2B5880",
    "#1E3E5C",
    "#13202D",
  ]),
};

export const font = {
  family: {
    display: '"Hedvig Letters Serif", "Iowan Old Style", Georgia, serif',
    body: '"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible Next", system-ui, sans-serif',
    number: '"Space Mono", ui-monospace, monospace',
  },
  size: {
    display: {
      xs: "1rem",
      sm: "1.1875rem",
      md: "1.375rem",
      lg: "1.625rem",
      xl: "2rem",
      "2xl": "2.5rem",
      "3xl": "3.75rem",
    },
    body: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1.0625rem",
      lg: "1.1875rem",
      xl: "1.375rem",
      "2xl": "1.625rem",
      "3xl": "2rem",
    },
    number: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1.125rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "2.75rem",
      "3xl": "3.5rem",
    },
  },
  weight: { light: "300", regular: "400", medium: "500", semibold: "600", bold: "700" },
  leading: { tight: "1.1", snug: "1.3", normal: "1.45", relaxed: "1.6" },
  tracking: { tight: "-0.015em", normal: "0" },
};

export const space = {
  "2xs": "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
} as const;

export const radius = {
  sm: "8px",
  md: "14px",
  lg: "18px",
  xl: "26px",
  full: "999px",
} as const;

export const shape = shapes;

export const size = {
  hair: "1px",
  focus: "2px",
  tick: "22px",
  icon: "22px",
  dot: "8px",
  "icon-sm": "18px",
  bar: "10px",
  "bar-thick": "24px",
  panel: "26rem",
  ring: "7rem",
  "ring-stroke": "10px",
  "toast-shape": "2rem",
  action: "4.5rem",
  handle: "2.5rem",
  "handle-height": "5px",
  "sheet-max": "85dvh",
  "menu-min": "12rem",
  day: "2.75rem",
  control: "44px",
  target: "44px",
  plus: "58px",
  tabbar: "64px",
  glow: "260px",
  "max-width": "420px",
} as const;

export const shadow = {
  "sm-light": "0 1px 2px rgb(0 0 0 / 0.04)",
  "md-light": "0 12px 32px rgb(0 0 0 / 0.16)",
  "md-dark": "0 12px 32px rgb(0 0 0 / 0.5)",
  "halo-light": "0 6px 18px rgb(108 195 176 / 0.6)",
  "halo-dark": "0 6px 18px rgb(134 217 198 / 0.6)",
} as const;

export const opacity = { "glow-dark": "0.38", "glow-light": "0.5", "noise-text": "0.25" } as const;

export const mix = {
  hover: "8%",
  tag: "9%",
  "accent-hover": "14%",
  pressed: "15%",
  soft: "16%",
  "accent-pressed": "24%",
  "scrim-light": "35%",
  "scrim-dark": "60%",
} as const;

export const motion = {
  duration: { instant: "0ms", fast: "160ms", slow: "220ms", pop: "600ms" },
  easing: { standard: "cubic-bezier(0.2, 0.7, 0.2, 1)", linear: "linear" },
} as const;

export const texture = {
  "noise-dark": noise(1, "0 0 0.09 0.18"),
  "noise-light": noise(0, "0 0 0.06 0.12"),
} as const;
