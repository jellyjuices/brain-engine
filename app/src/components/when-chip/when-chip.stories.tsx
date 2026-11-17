import type { Meta, StoryObj } from "@storybook/react-vite";
import { WhenChip } from "./when-chip.tsx";

const meta = {
  title: "Components/When chip",
  component: WhenChip,
  args: { label: "Fri, Nov 20", status: "due" },
  argTypes: {
    status: { control: "inline-radio", options: ["due", "today", "overdue", "waiting", "someday"] },
  },
} satisfies Meta<typeof WhenChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Due: Story = {};
export const Today: Story = { args: { label: "Today", status: "today" } };
export const Overdue: Story = { args: { label: "Fri, Nov 6", status: "overdue" } };
export const Waiting: Story = { args: { label: "Sam", status: "waiting" } };
export const Someday: Story = { args: { label: "Someday", status: "someday" } };
export const All: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-md)", justifyItems: "start" }}>
      <WhenChip label="Fri, Nov 20" status="due" />
      <WhenChip label="Today" status="today" />
      <WhenChip label="Fri, Nov 6" status="overdue" />
      <WhenChip label="Sam" status="waiting" />
      <WhenChip label="Someday" status="someday" />
    </div>
  ),
};
