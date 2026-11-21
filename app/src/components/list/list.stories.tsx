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
      <ListRow title="Sample to-do" sub="To-do · Sample note" onClick={fn()} />
      <ListRow title="Sample journal entry" sub="Journal · 2026-11-13" onClick={fn()} />
      <ListRow title="Read only" />
    </List>
  ),
};

export const WithKindIcons: Story = {
  render: (args) => (
    <List {...args}>
      <ListRow {...kindLook("person")} title="Sample person" sub="Person" chevron onClick={fn()} />
      <ListRow {...kindLook("place")} title="Sample place" sub="Place" chevron onClick={fn()} />
      <ListRow
        {...kindLook("goal")}
        title="Sample goal"
        sub="Goal"
        chevron
        onClick={fn()}
      />
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
    { id: "a", title: "Sample place" },
    { id: "b", title: "Sample project" },
    { id: "c", title: "Sample thing" },
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
