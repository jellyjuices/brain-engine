import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TimelineLine } from "./timeline-line.tsx";

const meta = {
  title: "Components/Timeline line",
  component: TimelineLine,
  parameters: { layout: "fullscreen" },
  args: {
    date: "2026-11-12",
    dateLabel: "Nov 12",
    kind: "fact",
    text: "The sample lease ends in March",
  },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: "var(--size-max-width)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof TimelineLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fact: Story = {};
export const FeelingWithAbout: Story = {
  args: {
    kind: "feeling",
    about: "The sample contract",
    areas: ["client-work", "money"],
    quote: true,
    text: "if they cannot afford my contract, then what",
    from: "journal",
  },
};
export const FeelingWithBefore: Story = {
  args: {
    kind: "feeling",
    about: "The people",
    quote: true,
    text: "the people are nice",
    before: "Before: Aug 14 “great sample team”",
  },
};
export const Done: Story = {
  args: { date: "2026-10-30", dateLabel: "Oct 30", kind: "done", text: "Shipped the sample page" },
};
export const Decision: Story = {
  args: { kind: "decision", text: "Stay freelance or go full time?", onOpen: fn() },
};
export const ManyAreas: Story = {
  args: {
    about: "Sample move",
    areas: ["home", "money", "life-admin", "relationships", "career", "health"],
  },
};
export const Timeline: Story = {
  render: () => (
    <>
      <TimelineLine
        date="2026-11-12"
        dateLabel="Nov 12"
        kind="feeling"
        about="The sample contract"
        quote
        text="if they cannot afford my contract, then what"
        from="journal"
      />
      <TimelineLine
        date="2026-11-12"
        dateLabel="Nov 12"
        kind="decision"
        text="Stay freelance or go full time?"
        onOpen={() => {}}
      />
      <TimelineLine
        date="2026-10-30"
        dateLabel="Oct 30"
        kind="done"
        text="Shipped the sample page"
      />
    </>
  ),
};
