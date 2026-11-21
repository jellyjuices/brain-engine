import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SKIPPED = /(^|\/)(node_modules\/|package-lock\.json$|[^/]*\.lock$|pnpm-lock\.yaml$)|^LICENSE$/;

const wordsPath =
  process.env.BRAIN_PRIVACY_WORDS ??
  join(homedir(), ".config", "brain", "privacy-words.txt");

if (!existsSync(wordsPath)) {
  console.warn(`privacy-check: no word list at ${wordsPath}. Skipping.`);
  process.exit(0);
}

const words = readFileSync(wordsPath, "utf8")
  .split("\n")
  .map((line) => line.trim().toLowerCase())
  .filter((line) => line !== "" && !line.startsWith("#"));

if (words.length === 0) {
  console.warn(`privacy-check: ${wordsPath} has no words. Skipping.`);
  process.exit(0);
}

const root = process.env.BRAIN_PRIVACY_ROOT ?? process.cwd();
const files = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter((file) => file !== "" && !SKIPPED.test(file));

let hits = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file));
  } catch {
    continue;
  }
  if (text.includes(0)) continue;
  const lines = text.toString("utf8").toLowerCase().split("\n");
  lines.forEach((line, index) => {
    if (words.some((word) => line.includes(word))) {
      console.error(`${file}:${index + 1}: private word`);
      hits += 1;
    }
  });
}

if (hits > 0) {
  console.error(`privacy-check: ${hits} hit(s).`);
  process.exit(1);
}
console.log("privacy-check: clean.");
