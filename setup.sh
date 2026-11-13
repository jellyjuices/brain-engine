#!/bin/bash
set -euo pipefail

usage() {
  cat <<'TXT'
Use: setup.sh [--brain PATH] [--no-jobs] [--force-agent-files] [--dry-run]

  --brain PATH          the brain folder (default: BRAIN_HOME, then the one in your config, then ~/brain)
  --no-jobs             skip the launchd jobs and the SwiftBar plugin
  --force-agent-files   replace the agent files (AGENTS.md, .claude/) in the brain folder with the starter ones
  --dry-run             check and print, but change nothing outside this repo

Settings go to ~/.config/brain/env, or $BRAIN_CONFIG/env when BRAIN_CONFIG is set.
TXT
}

DRY=0 JOBS=1 FORCE_AGENT=0 BRAIN_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --brain) BRAIN_ARG="${2:?--brain needs a path}"; shift 2 ;;
    --no-jobs) JOBS=0; shift ;;
    --force-agent-files) FORCE_AGENT=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

ENGINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CONFIG="${BRAIN_CONFIG:-$HOME/.config/brain}"
AGENTS_DIR="$HOME/Library/LaunchAgents"
LOGS="$HOME/Library/Logs/brain"

say()   { printf '\033[36m›\033[0m %s\n' "$1"; }
ok()    { printf '\033[32m✓\033[0m %s\n' "$1"; }
stop()  { printf '\033[31m✗\033[0m %s\n' "$1"; exit 1; }
would() { printf '\033[33m·\033[0m would: %s\n' "$1"; }

config_value() {
  [ -f "$CONFIG/env" ] || return 0
  (set +u; . "$CONFIG/env"; eval "printf '%s' \"\${$1:-}\"")
}

expand_home() { case "$1" in "~"*) printf '%s' "$HOME${1#\~}" ;; *) printf '%s' "$1" ;; esac; }

BRAIN_HOME="$(expand_home "${BRAIN_ARG:-${BRAIN_HOME:-$(config_value BRAIN_HOME)}}")"
BRAIN_HOME="${BRAIN_HOME:-$HOME/brain}"
case "$BRAIN_HOME" in "$ENGINE"|"$ENGINE"/*) stop "The brain folder cannot be inside the engine." ;; esac

check_node() {
  local found="${NODE:-$(command -v node || true)}"
  [ -n "$found" ] || stop "Node is not installed. Run: brew install node   Then run this again."
  NODE_BIN="$(cd "$(dirname "$found")" && pwd -P)/$(basename "$found")"
  NODE_BIN="$(readlink -f "$NODE_BIN" 2>/dev/null || printf '%s' "$NODE_BIN")"
  case "$NODE_BIN" in *fnm_multishells*) stop "Node resolves to a temporary fnm path. Set NODE to a fixed node path." ;; esac
  "$NODE_BIN" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=18)?0:1)' \
    || stop "Node $("$NODE_BIN" -v) is too old. You need 22.18 or later."
  "$NODE_BIN" --disable-warning=ExperimentalWarning -e "new (require('node:sqlite').DatabaseSync)(':memory:').exec('create virtual table t using fts5(a)')" \
    || stop "This Node has no SQLite full-text search. Run: brew install node"
  NODE_DIR="$(dirname "$NODE_BIN")"
  ok "Node $("$NODE_BIN" -v) at $NODE_BIN"
}

install_packages() {
  say "Installing packages"
  (cd "$ENGINE" && PATH="$NODE_DIR:$PATH" npm install --silent)
  chmod +x "$ENGINE/bin/brain.ts" "$ENGINE/daily.sh" "$ENGINE/launchd/status.sh" "$ENGINE/swiftbar/brain.5m.sh"
  if [ ! -f "$ENGINE/web/app/dist/index.html" ]; then
    if [ "$DRY" = 1 ]; then would "build the app in web/app"; else
      say "Building the app"
      (cd "$ENGINE/web/app" && PATH="$NODE_DIR:$PATH" npm install --silent && PATH="$NODE_DIR:$PATH" npm run -s build >/dev/null)
    fi
  fi
  ok "Packages installed"
}

is_agent_file() {
  case "$1" in AGENTS.md|.claude/*) return 0 ;; *) return 1 ;; esac
}

copy_starter() {
  local added=0 replaced=0 rel target
  [ "$DRY" = 1 ] || mkdir -p "$BRAIN_HOME"
  while IFS= read -r rel; do
    target="$BRAIN_HOME/$rel"
    [ "$rel" = gitignore ] && target="$BRAIN_HOME/.gitignore"
    if [ "$(basename "$rel")" = .gitkeep ]; then
      [ -d "$(dirname "$target")" ] && continue
    elif [ -e "$target" ]; then
      is_agent_file "$rel" && [ "$FORCE_AGENT" = 1 ] || continue
      replaced=$((replaced + 1))
    else
      added=$((added + 1))
    fi
    if [ "$DRY" = 1 ]; then would "write $target"; continue; fi
    mkdir -p "$(dirname "$target")"
    cp -p "$ENGINE/starter/$rel" "$target"
  done < <(cd "$ENGINE/starter" && find . -type f ! -name .DS_Store | sed 's|^\./||' | sort)
  ok "Brain folder $BRAIN_HOME: $added starter files added, $replaced agent files replaced"
}

write_config() {
  if [ "$DRY" = 1 ]; then would "write $CONFIG/env"; return; fi
  mkdir -p "$CONFIG"
  local kept=""
  [ -f "$CONFIG/env" ] && kept="$(grep -v -E '^(NODE|BRAIN_HOME|BRAIN_ENGINE)=' "$CONFIG/env" || true)"
  { printf 'NODE=%q\nBRAIN_HOME=%q\nBRAIN_ENGINE=%q\n' "$NODE_BIN" "$BRAIN_HOME" "$ENGINE"; [ -z "$kept" ] || printf '%s\n' "$kept"; } > "$CONFIG/env"
  ok "Settings in $CONFIG/env"
}

link_command() {
  if [ "$DRY" = 1 ]; then would "link brain to ~/.local/bin/brain and the global npm bin"; return; fi
  mkdir -p "$HOME/.local/bin"
  ln -sfn "$ENGINE/bin/brain.ts" "$HOME/.local/bin/brain"
  (cd "$ENGINE" && PATH="$NODE_DIR:$PATH" npm link --silent >/dev/null 2>&1) || true
  case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *)
    grep -q '.local/bin' "$HOME/.zshrc" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
    say "Open a new terminal tab to use brain" ;;
  esac
  ok "brain command linked to ~/.local/bin/brain"
}

init_git() {
  if [ -d "$BRAIN_HOME/.git" ]; then ok "Brain folder is already a git repo"; return; fi
  if [ "$DRY" = 1 ]; then would "git init $BRAIN_HOME with a first commit"; return; fi
  (cd "$BRAIN_HOME" && git init -q && git add -A && git commit -q -m "Start the second brain")
  ok "Git repo created with a first commit"
}

load_job() {
  local label="$1" plist="$AGENTS_DIR/$1.plist" i
  if [ "$DRY" = 1 ]; then would "write $plist and load it"; return; fi
  local cf="${CLOUDFLARED:-/usr/bin/true}"
  sed -e "s|__NODE__|$NODE_BIN|g" -e "s|__NODE_DIR__|$NODE_DIR|g" -e "s|__GIT_DIR__|$(dirname "$(command -v git)")|g" \
      -e "s|__ENGINE__|$ENGINE|g" -e "s|__BRAIN_HOME__|$BRAIN_HOME|g" -e "s|__LOGS__|$LOGS|g" -e "s|__HOME__|$HOME|g" \
      -e "s|__CLOUDFLARED__|$cf|g" -e "s|__CLOUDFLARED_DIR__|$(dirname "$cf")|g" \
      "$ENGINE/launchd/$label.plist" > "$plist"
  plutil -lint "$plist" >/dev/null || stop "$plist is not a valid plist."
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
  for i in 1 2 3 4 5 6 7 8 9 10; do
    launchctl print "gui/$(id -u)/$label" >/dev/null 2>&1 || break
    sleep 0.5
  done
  launchctl bootstrap "gui/$(id -u)" "$plist" || { sleep 2; launchctl bootstrap "gui/$(id -u)" "$plist"; }
  ok "Job $label loaded"
}

install_jobs() {
  [ "$DRY" = 1 ] || mkdir -p "$LOGS" "$AGENTS_DIR"
  load_job com.brain.daily
  load_job com.brain.serve
  if [ -f "$CONFIG/relay.env" ]; then load_job com.brain.pull
  else say "No $CONFIG/relay.env, so the phone pull is not set. See docs/phone-setup.md."; fi
  if CLOUDFLARED="$(command -v cloudflared)" && [ -f "$CONFIG/cloudflared.yml" ]; then load_job com.brain.tunnel
  else say "Tunnel not set. It needs cloudflared and $CONFIG/cloudflared.yml. See docs/phone-setup.md."; fi
}

link_swiftbar() {
  local dir
  dir="$(defaults read com.ameba.SwiftBar PluginDirectory 2>/dev/null || true)"
  dir="$(expand_home "$dir")"
  if [ -z "$dir" ] || [ ! -d "$dir" ]; then say "SwiftBar not found. Link swiftbar/brain.5m.sh into its plugin folder later."; return; fi
  if [ "$DRY" = 1 ]; then would "link the SwiftBar plugin into $dir"; return; fi
  ln -sfn "$ENGINE/swiftbar/brain.5m.sh" "$dir/brain.5m.sh"
  open -g "swiftbar://refreshallplugins" 2>/dev/null || true
  ok "SwiftBar plugin linked into $dir"
}

first_run() {
  if [ "$DRY" = 1 ]; then would "run brain index and brain check in $BRAIN_HOME"; return; fi
  BRAIN_HOME="$BRAIN_HOME" "$NODE_BIN" --disable-warning=ExperimentalWarning "$ENGINE/bin/brain.ts" index
  BRAIN_HOME="$BRAIN_HOME" "$NODE_BIN" --disable-warning=ExperimentalWarning "$ENGINE/bin/brain.ts" check || true
}

check_node
install_packages
copy_starter
write_config
link_command
init_git
if [ "$JOBS" = 1 ]; then install_jobs; link_swiftbar; else say "Skipped jobs and SwiftBar (--no-jobs)"; fi
first_run

echo
if [ "$DRY" = 1 ]; then ok "Dry run finished."; else ok "All set. Type: brain"; fi
