import type { Meta, StoryObj } from "@storybook/react-vite";
import { Markdown } from "./markdown.tsx";

const SRC = `# Moving plan

Call **Louis** about the move. See [[Gym]] for the new address.

## To do

- [ ] Book the truck
- [x] Pack the books
- Plain item

1. First
2. Second

> Keep the receipts.

\`\`\`
box-count: 12
\`\`\`

---

Done.`;

const meta = {
  title: "Components/Markdown",
  component: Markdown,
  args: { src: SRC, path: "notes/moving.md" },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Short: Story = { args: { src: "Just a **short** line." } };
