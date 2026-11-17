import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "./button.tsx";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Add to-do",
    variant: "primary",
    size: "md",
    disabled: false,
    block: false,
    busy: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "outlined", "ghost", "danger"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = { args: { icon: PlusIcon } };

export const Busy: Story = { args: { icon: PlusIcon, busy: true } };

export const Block: Story = { args: { block: true } };

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Add
      </Button>
      <Button {...args} variant="secondary">
        Sort
      </Button>
      <Button {...args} variant="outlined">
        Find
      </Button>
      <Button {...args} variant="ghost">
        Move
      </Button>
      <Button {...args} variant="danger">
        Delete
      </Button>
      <Button {...args} variant="primary" disabled>
        Done
      </Button>
      <Button {...args} variant="secondary" disabled>
        Sort
      </Button>
      <Button {...args} variant="ghost" disabled>
        Move
      </Button>
    </div>
  ),
};
