import type { Meta, StoryObj } from "@storybook/react-vite";
import { GoalProgress } from "./goal-progress.tsx";

const meta = {
  title: "Components/Goal progress",
  component: GoalProgress,
  args: { title: "Run a sample 10K", value: 62, note: "+2 this month" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--size-max-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
export const Empty: Story = { args: { value: 0, note: "Not started" } };
export const Full: Story = { args: { value: 100, note: "Done this month" } };
