import "./note.css";
import { Panel } from "@/components/panel/panel.tsx";

export function VersionCopy({ label, text, sub }: { label: string; text: string; sub?: string }) {
  return (
    <section className="version">
      <h2 className="section-label">{label}</h2>
      {sub && <p className="lede">{sub}</p>}
      <Panel>
        <pre className="version-text">{text}</pre>
      </Panel>
    </section>
  );
}
