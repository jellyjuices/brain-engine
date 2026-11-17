import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar } from "../bar/bar.tsx";
import { Chip } from "../chip-next/chip.tsx";
import { AreaMark } from "./area-mark.tsx";

const sets: [string, string[]][] = [
  ["1 area", ["fitness"]],
  ["2 areas", ["fitness", "health"]],
  ["3 areas", ["fitness", "health", "money"]],
  ["6 areas", ["fitness", "health", "money", "home", "career", "love-life"]],
];

const meta = {
  title: "Components/Area mark",
  component: AreaMark,
  args: { areas: ["fitness", "health"], size: "sm" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof AreaMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Counts: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)", maxWidth: "var(--size-max-width)" }}>
      {sets.map(([name, areas]) => (
        <section
          key={name}
          aria-label={name}
          style={{
            display: "grid",
            gap: "var(--space-sm)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-card)",
            background: "var(--background-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <AreaMark areas={areas} />
            <AreaMark areas={areas} size="md" />
            <Chip label="Sample subject" areas={areas} />
          </div>
          <Bar label={name} done={5} total={12} size="step" areas={areas} />
        </section>
      ))}
    </div>
  ),
};
