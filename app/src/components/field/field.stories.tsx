import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { MapPinIcon } from "@phosphor-icons/react";
import { PickField } from "./pick-field.tsx";
import { SearchInput } from "./search-input.tsx";
import { TextField } from "./text-field.tsx";

const meta = {
  title: "Components/Field",
  component: TextField,
  args: { label: "Name", value: "", placeholder: "Louis", onChange: fn() },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Text({ multiline }: { multiline?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <TextField
      label={multiline ? "About" : "Name"}
      placeholder="Type here"
      multiline={multiline}
      value={value}
      onChange={setValue}
    />
  );
}

function Search() {
  const [value, setValue] = useState("");
  return (
    <SearchInput placeholder="Find a note" value={value} onChange={setValue} autoFocus={false} />
  );
}

function Pick({ start }: { start?: string }) {
  const [value, setValue] = useState(start);
  return (
    <PickField
      label="Place"
      placeholder="Pick a place"
      icon={MapPinIcon}
      value={value}
      onPick={() => setValue("Gym")}
      onClear={() => setValue(undefined)}
    />
  );
}

export const Text_: Story = { name: "Text", render: () => <Text /> };
export const Multiline: Story = { render: () => <Text multiline /> };
export const Filled: Story = { args: { value: "Louis" } };
export const HiddenLabel: Story = { args: { hideLabel: true } };
export const Search_: Story = { name: "Search", render: () => <Search /> };
export const PickEmpty: Story = { render: () => <Pick /> };
export const PickFilled: Story = { render: () => <Pick start="Gym" /> };
