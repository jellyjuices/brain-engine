import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SuggestInput } from "./suggest-input.tsx";

const meta = {
  title: "Components/Input with suggestions",
  component: SuggestInput,
  args: {
    label: "About what?",
    placeholder: "Find a subject",
    disabled: false,
    hideLabel: false,
    onPick: fn(),
    suggestions: [
      { id: "home", label: "Home", hint: "Area" },
      { id: "health", label: "Health", hint: "Area" },
      { id: "northwind", label: "Northwind", hint: "Client" },
      { id: "sample-trip", label: "Sample trip", hint: "Project" },
      { id: "sam", label: "Sam Sample", hint: "Person" },
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{ maxWidth: "var(--layout-max-width)", minHeight: "calc(var(--size-control) * 7)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SuggestInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Disabled: Story = { args: { disabled: true } };
