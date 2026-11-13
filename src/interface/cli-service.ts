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

export async function killCommand(c: CliContext): Promise<number> {
  const { flags, json } = c;
  const { stopService } = await import("./service.ts");
  const result = await stopService();
  flags.json ? json(result) : result.lines.forEach((l) => out(l));
  return result.ok ? 0 : 1;
}

export async function serveCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const { runByLaunchd, startService } = await import("./service.ts");
  if (!flags.foreground && !runByLaunchd()) {
    const result = await startService();
    flags.json ? json(result) : result.lines.forEach((l) => out(l));
    return result.ok ? 0 : 1;
  }
  const { serve } = await import("./server.ts");
  try {
    return await serve(root, { host: flags.host, port: flags.port ? Number(flags.port) : undefined });
  } catch (err) {
    return fail((err as Error).message);
  }
}
