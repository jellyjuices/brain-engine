#!/bin/bash
set -u
CONFIG_ENV="${BRAIN_CONFIG:-$HOME/.config/brain}/env"
[ -f "$CONFIG_ENV" ] && . "$CONFIG_ENV"
: "${BRAIN_HOME:?No brain folder set. Run setup.sh in the brain engine.}"
ENGINE="${BRAIN_ENGINE:-$(cd "$(dirname "$0")/.." && pwd)}"
NODE="${NODE:-node}"
export BRAIN_HOME
brain() { "$NODE" --disable-warning=ExperimentalWarning "$ENGINE/engine/bin/brain.ts" "$@"; }

cd "$BRAIN_HOME" || exit 1
echo "== $(date '+%Y-%m-%d %H:%M')"
brain index
brain check > /dev/null || echo "brain check found problems. Run: brain check"
git add -A
git commit -q -m "daily: $(date +%F)" && echo "committed" || echo "nothing to commit"
