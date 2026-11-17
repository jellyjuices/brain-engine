import pc from "picocolors";
import { check, writeIndexMd } from "../reports/reports.ts";
import { updateIndex } from "../core/search.ts";
import { type CliContext, out } from "./cli-shared.ts";

export async function indexCommand(c: CliContext): Promise<number> {
  const { root, flags, report } = c;
  const result = updateIndex(root, flags.full);
  writeIndexMd(root);
  const { embedPending, loadEmbedder, meaningReady, pendingCount } = await import("../core/embed.ts");
  const embedder = pendingCount(root) > 0 ? await loadEmbedder() : null;
  const embedded = embedder ? await embedPending(root, embedder).catch(() => null) : 0;
  const meaning = (embedder !== null && embedded !== null) || meaningReady(root) ? "on" : "off";
  const offLine = meaning === "off" ? `\n${pc.dim("Meaning search is off. Find still works on words. To turn it on, run: BRAIN_MODEL_FETCH=1 brain index")}` : "";
  report({ ...result, meaning, embedded }, `${pc.green("Index up to date.")} ${result.total} notes (${result.added} added, ${result.updated} changed, ${result.removed} removed). .reports/index.md rebuilt.${offLine}`);
  return 0;
}

export async function checkCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const results = check(root);
  const errors = results.reduce((n, r) => n + r.issues.filter((i) => i.level === "error").length, 0);
  if (flags.json) json(results);
  else if (!results.length) out(pc.green("All notes look good."));
  else {
    for (const result of results) {
      out(pc.bold(result.path));
      for (const i of result.issues) out(`  ${i.level === "error" ? pc.red("error") : pc.yellow("warn ")} ${i.message}`);
    }
    out(`\n${errors} error${errors === 1 ? "" : "s"}.`);
  }
  return errors ? 1 : 0;
}

export async function swiftbarCommand(c: CliContext): Promise<number> {
  const { root } = c;
  const sb = await import("./swiftbar.ts");
  out(sb.render(root));
  return 0;
}
