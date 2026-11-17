import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar, type CalendarProps } from "./calendar.tsx";

const today = new Date(2026, 10, 13);

const Live = (args: CalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(args.selected);
  return (
    <div style={{ display: "grid", gap: "var(--space-md)" }}>
      <Calendar {...args} selected={date} onSelect={setDate} />
      <p style={{ color: "var(--text-secondary)" }}>
        Picked: {date ? date.toDateString() : "nothing"}
      </p>
    </div>
  );
};

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  render: Live,
  args: { selected: today, defaultMonth: today },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const PastDaysOff: Story = { args: { disabled: { before: today } } };
