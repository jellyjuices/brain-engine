import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef } from "react";
import { LIVE_CLASSES } from "./live-classes.ts";
import { liveSegments } from "@/lib/notes/live-marks.ts";
import { editableText } from "@/lib/platform/editable.ts";
import { renderLive } from "@/lib/platform/live-render.ts";

interface DemoProps {
  value: string;
  names: string[];
  tags: string[];
}

const Demo = ({ value, names, tags }: DemoProps) => {
  const box = useRef<HTMLDivElement>(null);
  function paint() {
    if (box.current)
      renderLive(
        box.current,
        liveSegments(editableText(box.current), { names, tags }),
        LIVE_CLASSES,
      );
  }
  useEffect(() => {
    if (!box.current) return;
    box.current.textContent = value;
    paint();
  });
  return (
    <div
      style={{
        padding: "var(--space-xl)",
        background: "var(--background-accent)",
        color: "var(--text-on-accent)",
        fontSize: "var(--font-size-body-2xl)",
        whiteSpace: "pre-wrap",
      }}
    >
      <div
        ref={box}
        role="textbox"
        aria-label="Live format demo"
        tabIndex={0}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        style={{ outline: "none" }}
        onInput={paint}
      />
    </div>
  );
};

const meta = {
  title: "Components/Add input live format",
  component: Demo,
  render: Demo,
  args: {
    value: "Call **Mum** about _the trip_ with @Ana #family\n- book flights\n- pack",
    names: ["Ana"],
    tags: ["family"],
  },
} satisfies Meta<typeof Demo>;

export default meta;

export const Formatted: StoryObj<typeof meta> = {};

export const TypeToBold: StoryObj<typeof meta> = {
  args: { value: "Type two stars, a word, and two more: **" },
};
