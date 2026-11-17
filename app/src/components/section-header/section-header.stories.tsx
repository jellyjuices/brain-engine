import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button.tsx";
import { SectionHeader } from "./section-header.tsx";

const meta = {
  title: "Components/Section header",
  component: SectionHeader,
  args: { title: "Due today", count: 4, tone: "default" },
  argTypes: { tone: { control: "inline-radio", options: ["default", "late"] } },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Late: Story = { args: { title: "Overdue", count: 2, tone: "late" } };
export const WithAction: Story = {
  args: {
    action: (
      <Button variant="ghost" size="sm">
        See all
      </Button>
    ),
  },
};
