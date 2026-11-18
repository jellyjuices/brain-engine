import styles from "./note.module.css";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { Panel } from "@/components/panel/panel.tsx";

export function VersionCopy({ label, text, sub }: { label: string; text: string; sub?: string }) {
  return (
    <section className={styles.version}>
      <SectionHeader title={label} />
      {sub && <p className={styles.lede}>{sub}</p>}
      <Panel>
        <pre className={styles.versionText}>{text}</pre>
      </Panel>
    </section>
  );
}
