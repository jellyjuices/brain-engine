#!/usr/bin/env bash
# Puts the phone app on APP_HOST and links it to this Mac. Names come from ~/.config/brain/web.env.
# Safe to run again: each step skips what is already done.
set -euo pipefail

WEB_ENV="${BRAIN_WEB_ENV:-$HOME/.config/brain/web.env}"
[ -f "$WEB_ENV" ] || { echo "No $WEB_ENV. Add APP_HOST, MAC_HOST and D1_ID to it. See docs/phone-setup.md."; exit 1; }
. "$WEB_ENV"
: "${APP_HOST:?APP_HOST is missing in $WEB_ENV}" "${MAC_HOST:?MAC_HOST is missing in $WEB_ENV}"
CONF="$HOME/.config/brain/cloudflared.yml"
HERE="$(cd "$(dirname "$0")" && pwd)"

say() { printf '\033[32m✓\033[0m %s\n' "$1"; }

# 1. The tunnel.
if ! cloudflared tunnel list 2>/dev/null | grep -qw brain; then
  cloudflared tunnel create brain >/dev/null
fi
ID="$(cloudflared tunnel list 2>/dev/null | awk '$2 == "brain" { print $1 }')"
[ -n "$ID" ] || { echo "Could not find the tunnel id."; exit 1; }
say "Tunnel brain ($ID)"

# 2. The Mac's name points at the tunnel.
cloudflared tunnel route dns --overwrite-dns brain "$MAC_HOST" >/dev/null
say "$MAC_HOST points at the tunnel"

# 3. The tunnel settings, read by the launchd job.
umask 077
mkdir -p "$HOME/.config/brain"
cat > "$CONF" <<YML
tunnel: $ID
credentials-file: $HOME/.cloudflared/$ID.json

ingress:
  - hostname: $MAC_HOST
    service: http://127.0.0.1:8787
  - service: http_status:404
YML
chmod 600 "$CONF"
say "Tunnel settings in $CONF"

# 4. Build the app and deploy the Worker on its own name.
(cd "$HERE/app" && npm run -s build >/dev/null)
(cd "$HERE/worker" && npx wrangler deploy >/dev/null)
say "Phone app deployed to https://$APP_HOST"

# 5. brain pull uses the new name.
sed -i '' "s|^RELAY_URL=.*|RELAY_URL=https://$APP_HOST|" "$HOME/.config/brain/relay.env"
say "brain pull uses https://$APP_HOST"

# 6. Keep the tunnel running.
"$HERE/../ops/setup.sh" >/dev/null
say "Tunnel kept running"

echo
echo "Done. Open https://$APP_HOST on your phone. The name can take a few minutes to work."
