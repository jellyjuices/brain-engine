# Intent: Connections

**Intent:** show the owner, at a glance, how any item links to the rest of their brain, and let them move through those links.

## Problem

- Links between people, subjects, goals and decisions are hard to see in lists.
- The owner cannot see which parts of their life cluster around one item.

## Outcomes

1. From any item, for example a person page, the owner opens Connections.
2. They see a web of related items: people, topics, groups, goals, decisions and more.
3. Each item is a coloured dot. Each link is a line.
4. They can zoom in and out.
5. Tapping a dot moves them to that item, and the web re-centres on it.
6. They can open the full page of any dot.

## User

The owner, when they want to see how one part of their life ties to others, or to explore from one subject to the next.

## Constraints

- Connections opens from an item, not from the tab bar.
- The web reads links that already exist in the notes. It adds none.
- Colour shows the kind of item, the same colour everywhere.
- Names only, never raw Markdown links.
- A relation is a line under a type heading, for example `# People`: `- [Omar](../people/omar.md) · co-founder · since 2025`. The link, then an optional role in the owner's words, then an optional time or status.
- A relation is written on one side only. The index stores each line once, and the other side is found by looking up its target.

## Open questions

1. How many link steps out the web shows by default.
