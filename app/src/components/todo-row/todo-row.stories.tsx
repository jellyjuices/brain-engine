import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { CalendarDotsIcon, FunnelSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { TodoRow, type TodoRowProps } from "./todo-row.tsx";
import { Checkbox } from "../checkbox/checkbox.tsx";

const Live = (args: TodoRowProps) => {
  const [checked, setChecked] = useState(args.checked ?? false);
  return (
    <ul style={{ margin: 0, padding: 0, maxWidth: "var(--layout-max-width)" }}>
      <TodoRow
        {...args}
        checked={checked}
        start={
          <Checkbox
            checked={checked}
            disabled={args.disabled}
            label={args.title}
            onCheckedChange={setChecked}
          />
        }
      />
    </ul>
  );
};

const meta = {
  title: "Components/To-do row",
  component: TodoRow,
  render: Live,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Send the sample invoice",
    tag: "Northwind",
    areas: ["client-work"],
    when: { label: "Today", status: "today" },
    checked: false,
    disabled: false,
    onOpen: fn(),
    onMenu: fn(),
    actions: [
      { id: "later", label: "Tomorrow", icon: CalendarDotsIcon, tone: "later", onSelect: fn() },
      { id: "sort", label: "Sort", icon: FunnelSimpleIcon, tone: "sort", onSelect: fn() },
      { id: "delete", label: "Delete", icon: TrashIcon, tone: "delete", onSelect: fn() },
    ],
  },
} satisfies Meta<typeof TodoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const Full: Story = {
  args: {
    title: "Ask Sam and Lee about more sample data types",
    when: { label: "Fri, Nov 20", status: "due" },
    people: ["Sam", "Lee"],
    goal: "Run a sample 10K",
    goalAreas: ["fitness", "health"],
    from: "journal",
  },
};
export const Overdue: Story = {
  args: {
    title: "Book the sample appointment",
    tag: "Home",
    areas: ["home"],
    when: { label: "Tue, Nov 10", status: "overdue" },
  },
};
export const Waiting: Story = {
  args: { title: "Get the sample quote back", when: { label: "Sam", status: "waiting" } },
};
export const Someday: Story = {
  args: {
    title: "Learn a sample recipe",
    tag: "General",
    areas: ["general"],
    when: { label: "Someday", status: "someday" },
  },
};
export const NeedsCheck: Story = {
  args: {
    title: "Call about the sample quote",
    tag: "Health",
    areas: ["health"],
    check: true,
    when: undefined,
    from: "journal",
  },
};
export const ManyAreas: Story = {
  args: { areas: ["client-work", "career", "money", "business-admin", "home", "health"] },
};
export const Done: Story = { args: { checked: true } };
export const Pressed: Story = { args: { pressed: true } };
export const Swiped: Story = { args: { defaultSwiped: true } };
export const Disabled: Story = { args: { disabled: true } };
export const OnSecondary: Story = {
  args: { surface: "secondary", defaultSwiped: true },
  decorators: [
    (Story) => (
      <div style={{ background: "var(--background-secondary)" }}>
        <Story />
      </div>
    ),
  ],
};
export const List: Story = {
  render: (args) => (
    <ul style={{ margin: 0, padding: 0, maxWidth: "var(--layout-max-width)" }}>
      <TodoRow
        {...args}
        title="Book the sample appointment"
        tag="Home"
        areas={["home"]}
        when={{ label: "Tue, Nov 10", status: "overdue" }}
      />
      <TodoRow {...args} />
      <TodoRow
        {...args}
        title="Get the sample quote back"
        tag={undefined}
        when={{ label: "Sam", status: "waiting" }}
        goal="Run a sample 10K"
      />
      <TodoRow
        {...args}
        title="Call about the sample quote"
        check
        from="journal"
        when={undefined}
      />
    </ul>
  ),
};
