import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
export const STARTER = join(REPO, "..", "starter");
export const BIN = join(REPO, "bin", "brain.ts");

function blankAreas(repo: string, root: string): void {
  mkdirSync(join(root, "areas"), { recursive: true });
  for (const f of readdirSync(join(repo, "areas")).filter((x) => x.endsWith(".md"))) {
    const title = readFileSync(join(repo, "areas", f), "utf8").match(/^title: (.+)$/m)?.[1].trim() ?? f.slice(0, -3);
    const slug = f.slice(0, -3);
    writeFileSync(join(root, "areas", f), `---\ntype: Area\ntitle: ${title}\ndescription: The ${slug} area.\ntags: [${slug}]\nstatus: stable\n---\n\n# What this covers\n\n# Now\n\n# To-dos\n`);
  }
}

export function makeBrain(): string {
  const root = mkdtempSync(join(tmpdir(), "brain-test-"));
  for (const d of [".schema", ".templates"]) cpSync(join(STARTER, d), join(root, d), { recursive: true });
  blankAreas(STARTER, root);
  for (const d of ["inbox", "projects", "people", "groups", "places", "things", "topics", "events", "resources", "journal", "goals", "decisions", ".archive", ".reports"]) mkdirSync(join(root, d), { recursive: true });
  return root;
}
