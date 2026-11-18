import styles from "./add-box.module.css";
import type { MarkClasses } from "@/lib/platform/live-render.ts";

export const LIVE_CLASSES: MarkClasses = {
  mark: styles.liveMark!,
  bold: styles.liveBold!,
  italic: styles.liveItalic!,
  mention: styles.liveMention!,
  bullet: styles.liveBullet!,
};
