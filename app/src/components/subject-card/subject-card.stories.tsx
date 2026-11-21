import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Card } from "@/lib/notes/card-types.ts";
import { SubjectCard } from "./subject-card.tsx";

const card: Card = {
  subject: {
    path: "subjects/sample-project.md",
    title: "Sample project",
    type: "project",
    description: "Sample description.",
  },
  todo: [
    {
      text: "Sample to-do",
      path: "subjects/sample-project.md",
      noteTitle: "Sample project",
      due: "2026-11-20",
    },
    {
      text: "Another sample to-do",
      path: "journal/2026-11-12.md",
      noteTitle: "Sample journal entry",
    },
  ],
  next: { date: "2026-12-02", text: "Sample event", path: "journal/2026-12-02.md" },
  history: [
    { date: "2026-11-10", text: "Sample fact.", path: "journal/2026-11-10.md" },
    { date: "2026-11-03", text: "Another sample fact.", path: "journal/2026-11-03.md" },
  ],
  relations: [
    {
      direction: "out",
      path: "people/sample-person.md",
      title: "Sample person",
      role: "sample role",
      heading: "People",
    },
    {
      direction: "out",
      path: "people/another-sample-person.md",
      title: "Another sample person",
      role: "another sample role",
      heading: "People",
    },
    {
      direction: "in",
      path: "journal/2026-11-10.md",
      title: "Sample journal entry",
      heading: "Mentions",
      time: "Nov 10",
    },
  ],
  related: [
    {
      path: "subjects/related-project.md",
      title: "Related project",
      type: "project",
      description: "",
    },
  ],
};

const meta = {
  title: "App/Subject card",
  component: SubjectCard,
  args: { card, heading: true },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeading: Story = {};

export const OnANote: Story = { args: { heading: false } };

export const OnlyRelations: Story = {
  args: { card: { ...card, todo: [], next: undefined, history: [] } },
};
