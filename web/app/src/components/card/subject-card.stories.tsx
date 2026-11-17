import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/app.css";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Card } from "@/lib/notes/card-types.ts";
import { SubjectCard } from "./subject-card.tsx";

const card: Card = {
  subject: {
    path: "subjects/northwind.md",
    title: "Northwind",
    type: "client",
    description: "Redesign of the shipping dashboard, due before the spring launch.",
  },
  todo: [
    {
      text: "Send the sample invoice",
      path: "subjects/northwind.md",
      noteTitle: "Northwind",
      due: "2026-11-20",
    },
    {
      text: "Book the kickoff call",
      path: "journal/2026-11-12.md",
      noteTitle: "Tuesday",
    },
  ],
  next: { date: "2026-12-02", text: "Kickoff call", path: "journal/2026-12-02.md" },
  history: [
    { date: "2026-11-10", text: "Signed the scope.", path: "journal/2026-11-10.md" },
    { date: "2026-11-03", text: "First call with the team.", path: "journal/2026-11-03.md" },
  ],
  relations: [
    {
      direction: "out",
      path: "people/ana-reyes.md",
      title: "Ana Reyes",
      role: "lead",
      heading: "People",
    },
    {
      direction: "out",
      path: "people/sam-okafor.md",
      title: "Sam Okafor",
      role: "billing",
      heading: "People",
    },
    {
      direction: "in",
      path: "journal/2026-11-10.md",
      title: "Signed the scope",
      heading: "Mentions",
      time: "Nov 10",
    },
  ],
  related: [
    {
      path: "subjects/shipping-api.md",
      title: "Shipping API",
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
