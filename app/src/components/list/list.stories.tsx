import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { GearIcon, TrashIcon, UserIcon } from "@phosphor-icons/react";
import { List } from "./list.tsx";
import { ListRow } from "./list-row.tsx";
import { kindLook } from "@/lib/notes/kinds.ts";

const meta = {
  title: "Components/List",
  component: List,
  args: { variant: "outlined", children: null },
  argTypes: {
    variant: { control: "inline-radio", options: ["outlined", "ghost", "menu", "plain"] },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  render: (args) => (
    <List {...args}>
      <ListRow title="Call Louis about the move" sub="To-do · Moving" onClick={fn()} />
      <ListRow title="Dinner with Louis on Friday" sub="Journal · 2026-11-13" onClick={fn()} />
      <ListRow title="Read only" />
    </List>
  ),
};

export const WithKindIcons: Story = {
  render: (args) => (
    <List {...args}>
      <ListRow {...kindLook("person")} title="Louis" sub="Person" chevron onClick={fn()} />
      <ListRow {...kindLook("place")} title="Gym" sub="Place" chevron onClick={fn()} />
      <ListRow {...kindLook("goal")} title="Run a half marathon" sub="Goal" chevron onClick={fn()} />
    </List>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <List {...args}>
      <ListRow icon={UserIcon} title="Default" onClick={fn()} />
      <ListRow icon={GearIcon} title="Primary" variant="primary" onClick={fn()} />
      <ListRow icon={TrashIcon} title="Delete" variant="danger" onClick={fn()} />
      <ListRow icon={GearIcon} title="Saving" busy />
    </List>
  ),
};

function Checks() {
  const [on, setOn] = useState(new Set(["b"]));
  const items = [
    { id: "a", title: "Gym" },
    { id: "b", title: "Northwind" },
    { id: "c", title: "Home" },
  ];
  return (
    <List variant="ghost">
      {items.map((x) => (
        <ListRow
          key={x.id}
          title={x.title}
          checked={on.has(x.id)}
          onClick={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (!next.delete(x.id)) next.add(x.id);
              return next;
            })
          }
        />
      ))}
    </List>
  );
}

export const Checkable: Story = { render: () => <Checks /> };
