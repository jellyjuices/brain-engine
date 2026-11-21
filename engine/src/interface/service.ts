import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const JOBS = ["com.brain.serve", "com.brain.tunnel"] as const;

export type Run = (args: string[]) => { ok: boolean; out: string };

const launchctl: Run = (args) => {
  const proc = spawnSync("launchctl", args, { encoding: "utf8" });
  return { ok: proc.status === 0, out: `${proc.stdout ?? ""}${proc.stderr ?? ""}`.trim() };
};

export interface ServiceDeps {
  run?: Run;
  uid?: number;
  agentsDir?: string;
  sleep?: (ms: number) => Promise<void>;
  health?: () => Promise<boolean>;
}

function deps(d: ServiceDeps) {
  return {
    run: d.run ?? launchctl,
    uid: d.uid ?? process.getuid?.() ?? 501,
    agentsDir: d.agentsDir ?? join(homedir(), "Library", "LaunchAgents"),
    sleep: d.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms))),
    health:
      d.health ??
      (async () => {
        try {
          return (await fetch("http://127.0.0.1:8787/api/health", { signal: AbortSignal.timeout(1000) })).ok;
        } catch {
          return false;
        }
      }),
  };
}

export const runByLaunchd = () => process.env.XPC_SERVICE_NAME === "com.brain.serve";

async function waitFor(check: () => boolean | Promise<boolean>, sleep: (ms: number) => Promise<void>, tries = 20): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    if (await check()) return true;
    await sleep(250);
  }
  return false;
}

export interface ServiceResult {
  ok: boolean;
  lines: string[];
}

export async function startService(d: ServiceDeps = {}): Promise<ServiceResult> {
  const { run, uid, agentsDir, sleep, health } = deps(d);
  const lines: string[] = [];
  const present = JOBS.filter((j) => existsSync(join(agentsDir, `${j}.plist`)));
  if (!present.includes("com.brain.serve")) return { ok: false, lines: ["Device access is not set up yet. Run setup.sh in the brain engine first."] };

  for (const job of present) {
    const target = `gui/${uid}/${job}`;
    run(["enable", target]);
    if (run(["print", target]).ok) continue;
    const loaded = run(["bootstrap", `gui/${uid}`, join(agentsDir, `${job}.plist`)]);
    if (!loaded.ok) lines.push(`Could not start ${job}: ${loaded.out}`);
  }
  if (!present.includes("com.brain.tunnel")) lines.push("The tunnel is not set up, so only the home server can reach it. See resources/phone-setup.md.");

  const up = await waitFor(health, sleep);
  lines.unshift(up ? "Device access is on." : "Started, but the server does not answer yet. Check ~/Library/Logs/brain/serve.log.");
  return { ok: up && lines.length === 1, lines };
}

export async function stopService(d: ServiceDeps = {}): Promise<ServiceResult> {
  const { run, uid, sleep } = deps(d);
  for (const job of JOBS) {
    const target = `gui/${uid}/${job}`;
    run(["bootout", target]);
    run(["disable", target]);
  }
  const gone = await waitFor(() => JOBS.every((j) => !run(["print", `gui/${uid}/${j}`]).ok), sleep);
  return gone
    ? { ok: true, lines: ["Device access is off. Adds from your devices wait until you run brain serve."] }
    : { ok: false, lines: ["Device access is still stopping. Run brain kill again in a moment."] };
}
