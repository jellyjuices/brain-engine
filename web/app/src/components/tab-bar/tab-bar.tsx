import "./tab-bar.css";
import {
  FilesIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SunIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { AddPanel } from "@/components/add-panel/add-panel.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import type { ScreenName } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

type Tab = { name: ScreenName; label: string; icon: PhosphorIcon } | "add";

const TABS: Tab[] = [
  { name: "today", label: copy.nav.today, icon: SunIcon },
  { name: "find", label: copy.nav.find, icon: MagnifyingGlassIcon },
  "add",
  { name: "brain", label: copy.nav.brain, icon: FilesIcon },
  { name: "settings", label: copy.nav.settings, icon: GearIcon },
];

export function TabBar() {
  const { name: current } = useRoute();
  return (
    <nav className="tabbar" aria-label={copy.nav.main}>
      {TABS.map((t) =>
        t === "add" ? (
          <AddPanel key="add" />
        ) : (
          <a
            key={t.name}
            className="tab"
            href={`/${t.name}`}
            aria-current={t.name === current ? "page" : undefined}
          >
            <Icon icon={t.icon} />
            <span>{t.label}</span>
          </a>
        ),
      )}
    </nav>
  );
}
