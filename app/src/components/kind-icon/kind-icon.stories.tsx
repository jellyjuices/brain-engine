import type { Meta, StoryObj } from "@storybook/react-vite";
import { KindIcon } from "./kind-icon.tsx";
import { kindLook, type KindName } from "@/lib/notes/kinds.ts";

const KINDS: KindName[] = [
  "todo",
  "journal",
  "person",
  "place",
  "thing",
  "file",
  "intake",
  "other",
  "area",
  "project",
  "group",
  "topic",
  "event",
  "note",
  "goal",
  "decision",
  "capture",
  "lens",
];

const meta = {
  title: "Components/Kind icon",
  component: KindIcon,
  args: { name: "person", icon: kindLook("person").icon, size: "md", variant: "default" },
  argTypes: {
    name: { control: "select", options: KINDS },
    size: { control: "inline-radio", options: ["md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "primary", "secondary"] },
  },
} satisfies Meta<typeof KindIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { size: "lg" } };
export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };

export const AllKinds: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      {KINDS.map((kind) => (
        <KindIcon key={kind} {...args} name={kind} icon={kindLook(kind).icon} />
      ))}
    </div>
  ),
};
