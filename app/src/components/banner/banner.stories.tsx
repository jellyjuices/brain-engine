import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Banner } from "./banner.tsx";

const meta = {
  title: "Components/Banner",
  component: Banner,
  args: { count: 3, message: "to sort", actionLabel: "Sort", onAction: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--size-max-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsorted: Story = {};
export const One: Story = { args: { count: 1 } };
export const NoCount: Story = {
  args: { count: undefined, message: "Journal entries wait to sort" },
};
export const NoAction: Story = { args: { actionLabel: undefined } };
