import type { Meta, StoryObj } from "@storybook/react-vite";
import { Markdown } from "./markdown.tsx";

const SRC = `# Sample note

Text with **bold**. See [[Sample place]] for more.

## To do

- [ ] Open to-do
- [x] Done to-do
- Plain item

1. First
2. Second

> A quote.

\`\`\`
code: sample
\`\`\`

---

Done.`;

const meta = {
  title: "Components/Markdown",
  component: Markdown,
  args: { src: SRC, path: "notes/sample.md" },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Short: Story = { args: { src: "Just a **short** line." } };
