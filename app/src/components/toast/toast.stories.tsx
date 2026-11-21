import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { Button } from "../button/button.tsx";
import { Toast, ToastProvider, type ToastProps } from "./toast.tsx";

function Live(args: ToastProps) {
  const [open, setOpen] = useState(args.open);
  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Show toast</Button>
      <Toast {...args} open={open} onOpenChange={setOpen} />
    </ToastProvider>
  );
}

function act(label: string) {
  return [{ label, onClick: () => {} }];
}

const meta = {
  title: "Components/Toast",
  component: Toast,
  render: Live,
  args: {
    open: true,
    onOpenChange: () => {},
    message: "Done",
    detail: "Sample to-do",
    variant: "success",
    actions: act("Undo"),
    duration: 6000,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["success", "deleted", "error", "warning", "info", "neutral"],
    },
    duration: { control: { type: "number", step: 1000 } },
    icon: { control: false },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DoneWithUndo: Story = {};
export const Moved: Story = {
  args: {
    variant: "neutral",
    message: "Moved to Home",
    detail: undefined,
    icon: ArrowsLeftRightIcon,
  },
};
export const Deleted: Story = {
  args: { variant: "deleted", message: "Deleted", detail: undefined },
};
export const Failed: Story = {
  args: {
    variant: "error",
    message: "Could not add",
    detail: "Your home server is out of reach",
    actions: act("Try again"),
  },
};
export const Warning: Story = {
  args: { variant: "warning", message: "Added, waiting to sync", detail: undefined, actions: [] },
};
export const Info: Story = {
  args: {
    variant: "info",
    message: "3 new entries to sort",
    detail: undefined,
    actions: act("Sort"),
  },
};
