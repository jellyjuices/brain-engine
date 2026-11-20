import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SearchList, type SearchItem } from "./search-list.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";

const NOTES = [
  { title: "Louis", type: "Person" },
  { title: "Gym", type: "Place" },
  { title: "Northwind", type: "Project" },
  { title: "Run a half marathon", type: "Goal" },
  { title: "Standing desk", type: "Thing" },
];

const items: SearchItem<string>[] = NOTES.map((n) => ({
  key: n.title,
  value: n.title,
  match: n.title,
  row: { ...typeLook(n.type), title: n.title, sub: n.type },
}));

const meta = {
  title: "Components/Search list",
  component: SearchList<string>,
  args: { placeholder: "Find a note", items, onPick: fn(), chevron: false },
} satisfies Meta<typeof SearchList<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAdd: Story = { args: { onAdd: fn() } };
export const Chevrons: Story = { args: { chevron: true } };
export const Empty: Story = { args: { items: [] } };
