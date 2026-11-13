import "./tab-bar.css";
import {
  FilesIcon,
  GearIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SunIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Icon } from "@/components/icon/icon.tsx";
import { useRoute } from "@/hooks/use-route.ts";
import type { ScreenName } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

const TABS: { name: ScreenName; label: string; icon: PhosphorIcon }[] = [
  { name: "today", label: copy.nav.today, icon: SunIcon },
  { name: "find", label: copy.nav.find, icon: MagnifyingGlassIcon },
  { name: "new", label: copy.nav.add, icon: PlusIcon },
  { name: "brain", label: copy.nav.brain, icon: FilesIcon },
  { name: "settings", label: copy.nav.settings, icon: GearIcon },
];

export function TabBar() {
  const { name: current } = useRoute();
  return (
    <nav className="tabbar" aria-label={copy.nav.main}>
      {TABS.map((t) => {
        const add = t.name === "new";
        return (
          <a
            key={t.name}
            className={add ? "tab tab--add" : "tab"}
            href={`/${t.name}`}
            aria-current={t.name === current || (add && current === "add") ? "page" : undefined}
          >
            {add ? (
              <span className="tab-disc">
                <Icon icon={t.icon} />
              </span>
            ) : (
              <Icon icon={t.icon} />
            )}
            <span className={add ? "label" : undefined}>{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
