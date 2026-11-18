import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar, type CalendarProps } from "./calendar.tsx";

const today = "2026-11-13";

function Live(args: CalendarProps) {
  const [date, setDate] = useState(args.value);
  return (
    <div style={{ display: "grid", gap: "var(--space-md)" }}>
      <Calendar {...args} value={date} onPick={setDate} />
      <p style={{ color: "var(--text-secondary)" }}>Picked: {date ?? "nothing"}</p>
    </div>
  );
}

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  render: Live,
  args: { today, value: today, onPick: () => {} },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const PastDaysOff: Story = { args: { min: today } };
export const Birthday: Story = { args: { max: today, yearSteps: true, value: undefined } };
