import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Chip } from "./chip.tsx";

const meta = {
  title: "Components/Tag chip",
  component: Chip,
  args: { label: "Sample project", variant: "tag", disabled: false },
  argTypes: { variant: { control: "inline-radio", options: ["tag", "check", "accent"] } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tag: Story = {};
export const Check: Story = { args: { label: "check", variant: "check" } };
export const Tappable: Story = { args: { onClick: fn() } };
export const Removable: Story = { args: { label: "Home", variant: "accent", onRemove: fn() } };
