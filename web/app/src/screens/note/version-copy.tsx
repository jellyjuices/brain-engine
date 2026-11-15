import { version, versionText } from "./note.styles.ts";
import { Panel } from "@/components/panel/panel.tsx";

export function VersionCopy({ label, text, sub }: { label: string; text: string; sub?: string }) {
  return (
    <section className={version}>
      <h2 className="section-label">{label}</h2>
      {sub && <p className="lede">{sub}</p>}
      <Panel>
        <pre className={versionText}>{text}</pre>
      </Panel>
    </section>
  );
}
