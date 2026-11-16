import "@ds/styles/base.css";
import { followSystemTheme } from "@/styles/theme.ts";
import "@/styles/base.css";
import "@/styles/app.css";

followSystemTheme();
import {
  BookOpenIcon,
  ChatCircleDotsIcon,
  CheckSquareIcon,
  DotsThreeIcon,
  FileTextIcon,
  HouseIcon,
  PackageIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { createRoot } from "react-dom/client";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { TabBar } from "@/shell/tab-bar/tab-bar.tsx";
import { trackViewport } from "@/lib/platform/viewport.ts";

const KINDS = [
  { shape: "todo", icon: CheckSquareIcon, title: "To-do" },
  { shape: "journal", icon: BookOpenIcon, title: "Journal" },
  { shape: "person", icon: UserIcon, title: "Person" },
  { shape: "place", icon: HouseIcon, title: "Place" },
  { shape: "thing", icon: PackageIcon, title: "Thing" },
  { shape: "file", icon: FileTextIcon, title: "File" },
  { shape: "intake", icon: ChatCircleDotsIcon, title: "Intake" },
  { shape: "other", icon: DotsThreeIcon, title: "Other" },
] as const;

trackViewport();

const host = document.getElementById("root");
if (host)
  createRoot(host).render(
    <div className="shell">
      <main className="preview-main">
        <List variant="outlined">
          {KINDS.map((k) => (
            <Row key={k.shape} shape={k.shape} icon={k.icon} title={k.title} />
          ))}
        </List>
      </main>
      <TabBar />
    </div>,
  );
