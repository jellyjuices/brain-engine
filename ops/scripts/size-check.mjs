import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const THRESHOLD = 200;
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);
const SKIPPED_FOLDERS = new Set(["node_modules", "dist", ".wrangler"]);

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function walk(folder) {
  const files = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const fullPath = join(folder, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_FOLDERS.has(entry.name)) files.push(...walk(fullPath));
    } else if (EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function countLines(file) {
  const content = readFileSync(file, "utf8");
  if (content === "") return 0;
  return content.replace(/\n$/, "").split("\n").length;
}

function colorize(lines, text) {
  if (lines < 250) return `${GREEN}${text}${RESET}`;
  if (lines <= 400) return `${YELLOW}${text}${RESET}`;
  return `${RED}${text}${RESET}`;
}

const folders = process.argv.slice(2);
if (folders.length === 0) {
  console.error("Usage: node size-check.mjs <folder> [folder...]");
  process.exit(2);
}

const oversized = folders
  .filter((folder) => existsSync(folder))
  .flatMap(walk)
  .map((file) => ({
    file: relative(process.cwd(), file),
    lines: countLines(file),
  }))
  .filter(({ lines }) => lines > THRESHOLD)
  .sort((a, b) => b.lines - a.lines);

if (oversized.length === 0) {
  console.log(`No files over ${THRESHOLD} lines in: ${folders.join(", ")}`);
} else {
  const width = String(oversized[0].lines).length;
  console.log(
    `${oversized.length} file(s) over ${THRESHOLD} lines (longest first):\n`,
  );
  for (const { file, lines } of oversized) {
    console.log(colorize(lines, `${String(lines).padStart(width)}  ${file}`));
  }
  process.exitCode = 1;
}
