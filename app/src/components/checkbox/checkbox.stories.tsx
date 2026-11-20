import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Checkbox } from "./checkbox.tsx";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: { checked: false, shape: "round", label: "Done", disabled: false },
  argTypes: { shape: { control: "inline-radio", options: ["round", "square"] } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Toggle({ shape }: { shape: "round" | "square" }) {
  const [checked, setChecked] = useState(false);
  return <Checkbox shape={shape} label="Done" checked={checked} onCheckedChange={setChecked} />;
}

export const Display: Story = { args: { checked: true } };
export const Round: Story = { render: () => <Toggle shape="round" /> };
export const Square: Story = { render: () => <Toggle shape="square" /> };
export const Disabled: Story = { args: { checked: true, disabled: true, onCheckedChange: () => {} } };
