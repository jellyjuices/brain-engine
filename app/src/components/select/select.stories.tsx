import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select, type SelectProps } from "./select.tsx";

const Live = (args: SelectProps) => {
  const [value, setValue] = useState(args.value);
  return (
    <div
      style={{ maxWidth: "var(--layout-max-width)", minHeight: "calc(var(--size-control) * 7)" }}
    >
      <Select {...args} value={value} onValueChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Components/Select",
  component: Select,
  render: Live,
  args: {
    label: "About what?",
    placeholder: "Pick a subject",
    disabled: false,
    items: [
      { value: "home", label: "Home" },
      { value: "health", label: "Health" },
      { value: "northwind", label: "Northwind" },
      { value: "trip", label: "Sample trip", disabled: true },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Picked: Story = { args: { value: "northwind" } };
export const Disabled: Story = { args: { disabled: true } };
