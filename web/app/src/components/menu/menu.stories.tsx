import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArchiveIcon,
  ArrowsLeftRightIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { fn } from "storybook/test";
import { Menu } from "./menu.tsx";

const meta = {
  title: "Components/Menu",
  component: Menu,
  args: {
    label: "More",
    groups: [
      [
        { id: "edit", label: "Edit", icon: PencilSimpleIcon, onSelect: fn() },
        { id: "move", label: "Move", icon: ArrowsLeftRightIcon, onSelect: fn() },
        { id: "archive", label: "Archive", icon: ArchiveIcon, disabled: true },
      ],
      [{ id: "drop", label: "Delete", icon: TrashIcon, tone: "danger", onSelect: fn() }],
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          maxWidth: "var(--size-max-width)",
          minHeight: "calc(var(--size-control) * 6)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
