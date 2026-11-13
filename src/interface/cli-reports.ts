import pc from "picocolors";
import { today } from "../core/notes.ts";
import { check, todayMarkdown, todayReport, weeklyMarkdown, weeklyReport, writeIndexMd } from "../reports/reports.ts";
import { updateIndex } from "../core/search.ts";
import { type CliContext, out, writeReport } from "./cli-shared.ts";

export async function todayCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const r = todayReport(root);
  const md = todayMarkdown(r);
  const path = writeReport(root, "today", md);
  flags.json ? json({ ...r, markdown: md }) : (out(md), out(pc.dim(`Saved to ${path}`)));
  return 0;
}

export async function weeklyCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const r = weeklyReport(root);
  const md = weeklyMarkdown(r);
  const path = writeReport(root, "weekly", md);
  flags.json ? json({ ...r, markdown: md }) : (out(md), out(pc.dim(`Saved to ${path}`)));
  return 0;
}

export async function reviewCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const mod = await import("../todos/review.ts");
  if (flags.json || !process.stdin.isTTY || !process.stdout.isTTY) return json({ date: today(), steps: mod.reviewSteps(root), areas: mod.reviewAreas(root) }), 0;
  return mod.runReview(root);
}

export async function indexCommand(c: CliContext): Promise<number> {
  const { root, flags, report } = c;
  const result = updateIndex(root, flags.full);
  writeIndexMd(root);
  report(result, `${pc.green("Index up to date.")} ${result.total} notes (${result.added} added, ${result.updated} changed, ${result.removed} removed). .reports/index.md rebuilt.`);
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
