import pc from "picocolors";
import { check, writeIndexMd } from "../reports/reports.ts";
import { updateIndex } from "../core/search.ts";
import { type CliContext, out, plural } from "./cli-shared.ts";

const OFF_LINE = `\n${pc.dim("Meaning search is off. Find still works on words. To turn it on, run: BRAIN_MODEL_FETCH=1 brain index")}`;

async function embedNew(root: string) {
  const { embedPending, loadEmbedder, meaningReady, pendingCount } = await import("../core/embed.ts");
  const embedder = pendingCount(root) > 0 ? await loadEmbedder() : null;
  if (!embedder) return { embedded: 0, on: meaningReady(root) };
  const embedded = await embedPending(root, embedder).catch(() => null);
  return { embedded, on: embedded !== null || meaningReady(root) };
}

export async function indexCommand(c: CliContext): Promise<number> {
  const result = updateIndex(c.root, c.flags.full);
  writeIndexMd(c.root);
  const { embedded, on } = await embedNew(c.root);
  const meaning = on ? "on" : "off";
  c.report({ ...result, meaning, embedded }, `${pc.green("Index up to date.")} ${result.total} notes (${result.added} added, ${result.updated} changed, ${result.removed} removed). .reports/index.md rebuilt.${on ? "" : OFF_LINE}`);
  return 0;
}

type CheckResult = ReturnType<typeof check>[number];

const countErrors = (results: CheckResult[]) => results.reduce((n, r) => n + r.issues.filter((i) => i.level === "error").length, 0);

const levelLabel = (level: string) => (level === "error" ? pc.red("error") : pc.yellow("warn "));

function printCheck(results: CheckResult[], errors: number) {
  if (!results.length) return out(pc.green("All notes look good."));
  for (const result of results) {
    out(pc.bold(result.path));
    for (const i of result.issues) out(`  ${levelLabel(i.level)} ${i.message}`);
  }
  out(`\n${plural(errors, "error")}.`);
}

export async function checkCommand(c: CliContext): Promise<number> {
  const results = check(c.root);
  const errors = countErrors(results);
  if (c.flags.json) c.json(results);
  else printCheck(results, errors);
  return errors ? 1 : 0;
}

export async function swiftbarCommand(c: CliContext): Promise<number> {
  const { root } = c;
  const sb = await import("./swiftbar.ts");
  out(sb.render(root));
  return 0;
}
