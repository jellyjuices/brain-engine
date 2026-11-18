import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DateField, type DateFieldProps } from "./date-field.tsx";

function Live(args: DateFieldProps) {
  const [date, setDate] = useState(args.value);
  return (
    <div style={{ maxWidth: "var(--layout-max-width)", minHeight: "calc(var(--size-control) * 9)" }}>
      <DateField {...args} value={date} onChange={setDate} />
    </div>
  );
}

const meta = {
  title: "Components/Date field",
  component: DateField,
  render: Live,
  args: { label: "When?", disabled: false, onChange: () => {} },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Picked: Story = { args: { value: "2026-11-20" } };
export const Disabled: Story = { args: { disabled: true } };
