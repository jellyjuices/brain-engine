import { type CliContext, fail, out } from "./cli-shared.ts";

export async function pullCommand(c: CliContext): Promise<number> {
  const { root, flags, json, report } = c;
  const { pull, readRelayConfig, relayEnvPath } = await import("../capture/pull.ts");
  const cfg = readRelayConfig();
  if (!cfg) {
    report({ pulled: 0, configured: false }, `No relay set up yet (${relayEnvPath()}). See resources/phone-setup.md.`);
    return 0;
  }
  try {
    const result = await pull(root, cfg);
    if (flags.json) json(result);
    else if (result.pulled) out(`Pulled ${result.pulled} from the phone${result.filed ? ` (${result.filed} added straight to a note)` : ""}.`);
    return 0;
  } catch (err) {
    return fail((err as Error).message);
  }
}

const MIGRATIONS: Record<string, () => Promise<(root: string, write: boolean, say: (s: string) => void) => number>> = {
  "areas-general": async () => (await import("../../migrations/2026-11-14-areas-general.ts")).runAreasGeneral,
};

export async function migrateCommand(c: CliContext): Promise<number> {
  const { root, args, flags } = c;
  const load = MIGRATIONS[args[0] ?? ""];
  if (!load) return fail(`Name a migration: ${Object.keys(MIGRATIONS).join(", ")}. Dry run by default; add --write to apply.`);
  return (await load())(root, !!flags.write, out);
}

export async function killCommand(c: CliContext): Promise<number> {
  const { flags, json } = c;
  const { stopService } = await import("./service.ts");
  const result = await stopService();
  flags.json ? json(result) : result.lines.forEach((l) => out(l));
  return result.ok ? 0 : 1;
}

async function startInBackground(c: CliContext): Promise<number> {
  const { startService } = await import("./service.ts");
  const result = await startService();
  c.flags.json ? c.json(result) : result.lines.forEach((l) => out(l));
  return result.ok ? 0 : 1;
}

async function serveHere(c: CliContext): Promise<number> {
  const { serve } = await import("./server.ts");
  const port = c.flags.port ? Number(c.flags.port) : undefined;
  try {
    return await serve(c.root, { host: c.flags.host, port });
  } catch (err) {
    return fail((err as Error).message);
  }
}

export async function serveCommand(c: CliContext): Promise<number> {
  const { runByLaunchd } = await import("./service.ts");
  const here = c.flags.foreground || runByLaunchd();
  return here ? serveHere(c) : startInBackground(c);
}
