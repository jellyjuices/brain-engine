import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar } from "../components/bar/bar.tsx";
import { PageHeader } from "../components/page-header/page-header.tsx";
import { Chip } from "../components/chip/chip.tsx";
import { name } from "./area-parts.tsx";

type Args = { first: string; second: string; value: number };

const slugs = [
  "health",
  "fitness",
  "rest-and-fun",
  "home",
  "money",
  "personal-projects",
  "client-work",
  "career",
  "business-admin",
  "life-admin",
  "relationships",
  "love-life",
];

const meta = {
  title: "Areas/Goal with two areas",
  parameters: { layout: "fullscreen" },
  args: { first: "health", second: "fitness", value: 62 },
  argTypes: {
    first: { control: "select", options: slugs },
    second: { control: "select", options: slugs },
    value: { control: { type: "range", min: 0, max: 100 } },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const GoalPage: Story = {
  render: ({ first, second, value }) => {
    const areas = [first, second];
    return (
      <div style={{ maxWidth: "var(--size-max-width)", margin: "0 auto" }}>
        <PageHeader title="Run a sample 10K" kicker="Goal" areas={areas}>
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              padding: "0 var(--space-lg) var(--space-md)",
            }}
          >
            {areas.map((a) => (
              <Chip key={a} label={name([a])} areas={[a]} />
            ))}
          </div>
        </PageHeader>
        <div style={{ display: "grid", gap: "var(--space-md)", padding: "var(--space-lg)" }}>
          <Bar
            label="Sample weekly runs"
            done={Math.round(value / 2)}
            total={100}
            countLabel="Next: run on Sunday"
            areas={areas}
          />
          <Chip label={name(areas)} areas={areas} />
        </div>
      </div>
    );
  },
};
