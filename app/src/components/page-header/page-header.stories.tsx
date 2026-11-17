import type { Meta, StoryObj } from "@storybook/react-vite";
import { GearSixIcon } from "@phosphor-icons/react";
import { Button } from "../button/button.tsx";
import { PageHeader } from "./page-header.tsx";

const meta = {
  title: "Components/Page header",
  component: PageHeader,
  args: {
    title: "To-dos",
    kicker: "Friday, Nov 13",
    glow: true,
    action: <Button variant="ghost" size="sm" aria-label="Settings" icon={GearSixIcon} />,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--size-max-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const NoGlow: Story = { args: { glow: false } };
