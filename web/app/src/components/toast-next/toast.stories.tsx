import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { Button } from "../button-next/button.tsx";
import { Toast, ToastProvider, type ToastProps } from "./toast.tsx";

const Live = (args: ToastProps) => {
  const [open, setOpen] = useState(args.open);
  const [undone, setUndone] = useState(0);
  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Show toast</Button>
      <p style={{ color: "var(--text-secondary)" }}>
        Swipe it right to close. Undo pressed: {undone}
      </p>
      <Toast
        {...args}
        open={open}
        onOpenChange={setOpen}
        onAction={() => setUndone((n) => n + 1)}
      />
    </ToastProvider>
  );
};

const meta = {
  title: "Components/Toast",
  component: Toast,
  render: Live,
  args: {
    open: true,
    onOpenChange: () => {},
    message: "Done",
    detail: "Send the sample invoice",
    variant: "success",
    actionLabel: "Undo",
    duration: 6000,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["success", "error", "warning", "info", "neutral"],
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
    actionLabel: "Undo",
    icon: ArrowsLeftRightIcon,
  },
};
export const Failed: Story = {
  args: {
    variant: "error",
    message: "Could not add",
    detail: "The Mac mini is out of reach",
    actionLabel: "Try again",
  },
};
export const Warning: Story = {
  args: {
    variant: "warning",
    message: "Added, waiting to sync",
    detail: undefined,
    actionLabel: undefined,
  },
};
export const Info: Story = {
  args: {
    variant: "info",
    message: "3 new entries to sort",
    detail: undefined,
    actionLabel: "Sort",
  },
};
