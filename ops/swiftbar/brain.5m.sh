#!/bin/bash
# <xbar.title>brain</xbar.title>
# <xbar.desc>Capture, find and see what is due in your brain folder.</xbar.desc>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideSwiftBar>true</swiftbar.hideSwiftBar>
CONFIG_ENV="${BRAIN_CONFIG:-$HOME/.config/brain}/env"
[ -f "$CONFIG_ENV" ] && . "$CONFIG_ENV"
if [ -z "${BRAIN_HOME:-}" ] || [ -z "${BRAIN_ENGINE:-}" ]; then
  echo " | sfimage=exclamationmark.triangle"
  echo "---"
  echo "No brain folder set. Run setup.sh in the brain engine."
  exit 0
fi
export BRAIN_HOME

find_node() {
  [ -n "${NODE:-}" ] && [ -x "$NODE" ] && { echo "$NODE"; return; }
  for n in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.homebrew/bin/node" \
           "$HOME/.volta/bin/node" $(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1); do
    [ -n "$n" ] && [ -x "$n" ] && { echo "$n"; return; }
  done
  /bin/zsh -lic 'command -v node' 2>/dev/null | tail -1
}
NODE="$(find_node)"
if [ -z "$NODE" ]; then
  echo " | sfimage=exclamationmark.triangle"
  echo "---"
  echo "Node not found. Run setup.sh in the brain engine."
  exit 0
fi
exec "$NODE" --disable-warning=ExperimentalWarning "$BRAIN_ENGINE/engine/bin/brain.ts" swiftbar "$@"
