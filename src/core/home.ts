import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function configDir(): string {
  return expandHome(process.env.BRAIN_CONFIG || join(homedir(), ".config", "brain"));
}

export function configValue(key: string): string | undefined {
  const file = join(configDir(), "env");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  return line ? unquote(line.slice(key.length + 1).trim()) : undefined;
}

export function brainHome(): string {
  const home = process.env.BRAIN_HOME || configValue("BRAIN_HOME");
  if (!home) throw new Error("No brain folder set. Run setup.sh in the brain engine, or set BRAIN_HOME.");
  return expandHome(home);
}

function expandHome(path: string): string {
  return path.startsWith("~") ? join(homedir(), path.slice(1)) : path;
}

function unquote(value: string): string {
  if (/^'.*'$/.test(value) || /^".*"$/.test(value)) return value.slice(1, -1);
  return value.replace(/\\(.)/g, "$1");
}
