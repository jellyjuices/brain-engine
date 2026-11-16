import "@/components/markdown/markdown.css";

export function DoneRow({ text }: { text: string }) {
  return (
    <div className="md-check is-done" role="checkbox" aria-checked="true" aria-readonly="true">
      <span className="md-box is-on" aria-hidden="true" />
      <span className="md-check-text">{text}</span>
    </div>
  );
}
