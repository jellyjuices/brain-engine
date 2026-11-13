# Phone setup

The phone app is a Cloudflare Worker with a D1 inbox. It reaches this Mac through a Cloudflare Tunnel. All of this is optional: the `brain` command, the daily job and `brain serve` work without it.

## Your values live outside the engine

Put these in `~/.config/brain/web.env`. The engine never holds them.

| Key | What it is |
| --- | --- |
| `APP_HOST` | The name the phone opens, for example `brain.example.com` |
| `MAC_HOST` | The tunnel name for this Mac, for example `brain-mac.example.com` |
| `D1_ID` | The id from `npx wrangler d1 create brain_inbox` |

`web/worker/write-config.sh` turns `web/worker/wrangler.example.toml` into `web/worker/wrangler.toml` (gitignored) from these values. `npm run dev` and `npm run deploy` in `web/worker` run it first.

## Worker secrets

Set with `npx wrangler secret put <NAME>` in `web/worker`: `RELAY_TOKEN`, `SERVER_TOKEN`, `SESSION_SECRET` and `PASSWORD`. For `wrangler dev`, put them in `web/worker/.dev.vars` (gitignored).

## This Mac

1. `~/.config/brain/relay.env` holds `RELAY_URL=https://<APP_HOST>` and `RELAY_TOKEN=<the same token>`. With it, `setup.sh` loads the 5-minute pull job.
2. Install `cloudflared` and log in with `cloudflared tunnel login`.
3. Run `web/go-live.sh` yourself. It makes the tunnel, points `MAC_HOST` at it, writes `~/.config/brain/cloudflared.yml`, builds the app, deploys the Worker and re-runs `setup.sh`.

A deploy is public. Agents never run `go-live.sh` or `npm run deploy`.
