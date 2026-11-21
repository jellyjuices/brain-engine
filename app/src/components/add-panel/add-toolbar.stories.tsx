import type { Meta, StoryObj } from "@storybook/react-vite";
import { AddToolbar } from "./add-toolbar.tsx";

function none() {}
const rest = { bold: false, italic: false, list: false, tag: false, mention: false };

const meta = {
  title: "Components/Add toolbar",
  component: AddToolbar,
  args: {
    journal: true,
    actions: { bold: none, italic: none, list: none, tag: none, mention: none },
    pressed: rest,
    drawer: null,
    end: null,
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "12rem", transform: "translateZ(0)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const BoldAndItalicOn: Story = { args: { pressed: { ...rest, bold: true, italic: true } } };
export const ListOn: Story = { args: { pressed: { ...rest, list: true } } };
export const PickerOpen: Story = { args: { pressed: { ...rest, tag: true } } };
