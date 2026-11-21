import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ViewTabs, type ViewTabsProps } from "./view-tabs.tsx";

const views = [
  { value: "today", label: "Today" },
  { value: "soon", label: "Soon" },
  { value: "no-date", label: "No date" },
  { value: "sample", label: "Sample view" },
  { value: "all", label: "All views" },
];

const Live = (args: ViewTabsProps) => {
  const [value, setValue] = useState(args.value);
  return <ViewTabs {...args} value={value} onValueChange={setValue} />;
};

const meta = {
  title: "Components/View tabs",
  component: ViewTabs,
  render: Live,
  args: {
    views,
    value: "today",
    label: "To-do views",
    onValueChange: () => {},
    renderPanel: (v: string) => <p style={{ padding: "var(--space-lg)" }}>Sample list for {v}</p>,
  },
} satisfies Meta<typeof ViewTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithDisabled: Story = {
  args: {
    views: [...views.slice(0, 3), { value: "sample", label: "Sample view", disabled: true }],
  },
};
