import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./panel.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";

const meta = {
  title: "Components/Panel",
  component: Panel,
  args: { label: "Today", children: null },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { children: <p>Call Louis about the move.</p> } };

export const WithList: Story = {
  args: {
    children: (
      <List variant="plain">
        <ListRow title="Call Louis about the move" sub="To-do · Moving" />
        <ListRow title="Dinner with Louis on Friday" sub="Journal · 2026-11-13" />
      </List>
    ),
  },
};
