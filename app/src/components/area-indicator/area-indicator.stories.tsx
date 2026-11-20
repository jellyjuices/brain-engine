import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "../progress-bar/progress-bar.tsx";
import { Chip } from "../chip/chip.tsx";
import { AreaIndicator } from "./area-indicator.tsx";

const sets: [string, string[]][] = [
  ["1 area", ["fitness"]],
  ["2 areas", ["fitness", "health"]],
  ["3 areas", ["fitness", "health", "money"]],
  ["6 areas", ["fitness", "health", "money", "home", "career", "love-life"]],
];

const meta = {
  title: "Components/Area indicator",
  component: AreaIndicator,
  args: { areas: ["fitness", "health"], size: "sm" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof AreaIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Counts: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)", maxWidth: "var(--layout-max-width)" }}>
      {sets.map(([name, areas]) => (
        <section
          key={name}
          aria-label={name}
          style={{
            display: "grid",
            gap: "var(--space-sm)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-lg)",
            background: "var(--background-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <AreaIndicator areas={areas} />
            <AreaIndicator areas={areas} size="md" />
            <Chip label="Sample subject" areas={areas} />
          </div>
          <ProgressBar label={name} done={5} total={12} size="step" areas={areas} />
        </section>
      ))}
    </div>
  ),
};
