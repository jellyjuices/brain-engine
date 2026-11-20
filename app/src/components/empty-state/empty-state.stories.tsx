import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./empty-state.tsx";

const meta = {
  title: "Components/Empty state",
  component: EmptyState,
  args: { title: "Nothing here yet", body: "Add a to-do and it shows up here.", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "sm", title: "No matches", body: undefined } };
export const TitleOnly: Story = { args: { body: undefined } };
