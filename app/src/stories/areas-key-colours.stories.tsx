import type { Meta, StoryObj } from "@storybook/react-vite";
import { areaSlugs } from "../../tokens/areas.ts";
import { KeyRow, label } from "./area-parts.tsx";

const meta = {
  title: "Areas/Key colours",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-xl)", maxWidth: "var(--layout-max-width)" }}>
      <p style={label}>
        One hue per area in tokens/areas.ts. A new area needs only a hue. Roles: accent, fill, text,
        glow.
      </p>
      {areaSlugs.map((slug) => (
        <KeyRow key={slug} slug={slug} />
      ))}
    </div>
  ),
};
