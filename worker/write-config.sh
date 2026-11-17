#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${BRAIN_WEB_ENV:-$HOME/.config/brain/web.env}"
[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE. Add APP_HOST, MAC_HOST and D1_ID to it. See docs/phone-setup.md."; exit 1; }
. "$ENV_FILE"
: "${APP_HOST:?APP_HOST is missing in $ENV_FILE}" "${MAC_HOST:?MAC_HOST is missing in $ENV_FILE}" "${D1_ID:?D1_ID is missing in $ENV_FILE}"
sed -e "s|__APP_HOST__|$APP_HOST|g" -e "s|__MAC_HOST__|$MAC_HOST|g" -e "s|__D1_ID__|$D1_ID|g" \
  "$HERE/wrangler.example.toml" > "$HERE/wrangler.toml"
