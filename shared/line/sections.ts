export const LOOPS_HEADING = "# To-dos";
export const OLD_LOOPS_HEADING = "# Open loops";
export const NOTES_HEADING = "# Notes";

export function sectionRange(lines: string[], heading: string): [number, number] | null {
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) return null;
  const nextHeading = lines.findIndex((line, i) => i > headingIndex && line.startsWith("# "));
  return [headingIndex + 1, nextHeading === -1 ? lines.length : nextHeading];
}

export function todoSectionRange(lines: string[]): [number, number] | null {
  return sectionRange(lines, LOOPS_HEADING) ?? sectionRange(lines, OLD_LOOPS_HEADING);
}

export function appendToSection(body: string, heading: string, line: string): string {
  const lines = body.replace(/\s+$/, "").split("\n");
  const range = sectionRange(lines, heading);
  if (!range) return `${lines.join("\n")}\n\n${heading}\n\n${line}\n`;
  let at = range[1];
  while (at > range[0] && lines[at - 1]?.trim() === "") at--;
  lines.splice(at, 0, ...(at === range[0] ? ["", line] : [line]));
  return lines.join("\n") + "\n";
}
