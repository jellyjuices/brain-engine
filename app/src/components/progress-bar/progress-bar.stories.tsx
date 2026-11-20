import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./progress-bar.tsx";

const meta = {
  title: "Components/Progress bar",
  component: ProgressBar,
  args: {
    label: "Run a sample 10K",
    done: 5,
    total: 12,
    countLabel: "5 of 12",
    gain: 2,
    gainLabel: "this month",
    size: "goal",
  },
  argTypes: {
    done: { control: { type: "range", min: 0, max: 12, step: 1 } },
    size: { control: "inline-radio", options: ["goal", "step"] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--layout-max-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Goal: Story = {};
export const WithAreas: Story = { args: { areas: ["fitness", "health"] } };
export const Small: Story = {
  args: {
    label: "Read 12 sample books",
    done: 3,
    total: 12,
    countLabel: "Next: pick book 4",
    gain: undefined,
  },
};
export const NoGain: Story = { args: { gain: 0 } };
export const Empty: Story = { args: { done: 0, gain: undefined, countLabel: "0 of 12" } };
export const Full: Story = { args: { done: 12, countLabel: "12 of 12" } };
export const Step: Story = { args: { size: "step", label: "Step 3 of 5", done: 3, total: 5 } };
