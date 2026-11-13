import { useRoute } from "@/hooks/use-route.ts";
import { FolderList } from "./folder-list.tsx";
import { ArchiveView } from "./archive-view.tsx";
import { FolderView } from "./folder-view.tsx";
import { isFolder } from "./folders.ts";

export function BrainScreen() {
  const { rest } = useRoute();
  if (rest === "archive") return <ArchiveView />;
  return isFolder(rest) ? <FolderView folder={rest} /> : <FolderList />;
}
