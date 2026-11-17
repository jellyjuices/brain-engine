import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  ArrowsDownUpIcon,
  CalendarBlankIcon,
  FolderSimpleIcon,
  PencilSimpleIcon,
  SquaresFourIcon,
  TagIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "../button-next/button.tsx";
import { OptionsMenu, type Option, type OptionsMenuProps } from "./options-menu.tsx";

const Live = (args: OptionsMenuProps) => {
  const [open, setOpen] = useState(args.open);
  const [sort, setSort] = useState("date");
  const [group, setGroup] = useState("none");
  const [last, setLast] = useState("nothing yet");

  const pick = (list: [string, string][], value: string, set: (v: string) => void): Option[] =>
    list.map(([id, label]) => ({
      id,
      label,
      selected: id === value,
      onSelect: () => (set(id), setLast(label)),
    }));

  const options: Option[] = [
    { id: "edit", label: "Edit", icon: PencilSimpleIcon, onSelect: () => setLast("Edit") },
    {
      id: "sort",
      label: "Sort",
      icon: ArrowsDownUpIcon,
      hint: sort === "date" ? "By date" : "By name",
      options: [
        ...pick(
          [
            ["date", "By date"],
            ["name", "By name"],
          ],
          sort,
          setSort,
        ),
        {
          id: "more",
          label: "More ways",
          options: pick(
            [
              ["added", "By when added"],
              ["subject", "By subject"],
            ],
            sort,
            setSort,
          ),
        },
      ],
    },
    {
      id: "group",
      label: "Group by",
      icon: SquaresFourIcon,
      options: [
        ...pick([["none", "No groups"]], group, setGroup),
        {
          id: "subject",
          label: "Subject",
          icon: FolderSimpleIcon,
          selected: group === "subject",
          onSelect: () => setGroup("subject"),
        },
        {
          id: "tag",
          label: "Tag",
          icon: TagIcon,
          selected: group === "tag",
          onSelect: () => setGroup("tag"),
        },
        {
          id: "when",
          label: "When",
          icon: CalendarBlankIcon,
          selected: group === "when",
          onSelect: () => setGroup("when"),
        },
      ],
    },
    {
      id: "drop",
      label: "Delete",
      icon: TrashIcon,
      tone: "danger",
      onSelect: () => setLast("Delete"),
    },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)}>Options</Button>
      <p style={{ color: "var(--text-secondary)" }}>
        Last pick: {last}. Sort: {sort}. Group: {group}.
      </p>
      <OptionsMenu {...args} open={open} onOpenChange={setOpen} options={options} />
    </>
  );
};

const meta = {
  title: "Components/Options menu",
  component: OptionsMenu,
  render: Live,
  parameters: { layout: "fullscreen" },
  args: { open: true, onOpenChange: () => {}, title: "Today", options: [], backLabel: "Back" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-lg)", minHeight: "100dvh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OptionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SortAndGroupBy: Story = {};
