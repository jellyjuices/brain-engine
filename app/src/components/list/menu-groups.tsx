import { ListDivider } from "./list-divider.tsx";
import { List } from "./list.tsx";
import { ListRow, type ListRowProps } from "./list-row.tsx";

export type MenuItem = Pick<ListRowProps, "icon" | "title" | "sub" | "variant" | "chevron"> & {
  id: string;
  onClick: () => void;
};

export interface MenuGroupsProps {
  groups: (MenuItem | false)[][];
}

export function MenuGroups({ groups }: MenuGroupsProps) {
  const shown = groups
    .map((group) => group.filter((item): item is MenuItem => Boolean(item)))
    .filter((group) => group.length > 0);
  const first = shown[0]?.[0]?.id;
  const rows = shown.flatMap((group, i) => [
    ...(i > 0 ? [<ListDivider key={`divider-${i}`} />] : []),
    ...group.map((item) => <ListRow key={item.id} {...item} autoFocus={item.id === first} />),
  ]);
  return <List variant="menu">{rows}</List>;
}
