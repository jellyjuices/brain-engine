import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/button.tsx";
import { Sheet, type SheetProps } from "./sheet.tsx";

const Live = (args: SheetProps) => {
  const [open, setOpen] = useState(args.open);
  return (
    <>
      <Button onClick={() => setOpen(true)}>View</Button>
      <Sheet {...args} open={open} onOpenChange={setOpen}>
        <div style={{ display: "grid", gap: "var(--space-sm)", padding: "var(--space-sm)" }}>
          <Button block onClick={() => setOpen(false)}>
            Done
          </Button>
          <Button block variant="secondary" onClick={() => setOpen(false)}>
            Move
          </Button>
        </div>
      </Sheet>
    </>
  );
};

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  render: Live,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Sample to-do",
    description: "Sample project · Today",
    closeLabel: "Close",
    children: null,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-lg)", minHeight: "100dvh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {};
export const NoDescription: Story = { args: { description: undefined, title: "Add" } };
export const NoClose: Story = { args: { closeLabel: undefined } };
export const Wide: Story = { globals: { viewport: { value: "desktop", isRotated: false } } };
export const Closed: Story = { args: { open: false } };
