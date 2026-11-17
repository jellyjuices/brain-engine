# Phone setup

The phone app is a Cloudflare Worker with a D1 inbox. It reaches this Mac through a Cloudflare Tunnel. All of this is optional: the `brain` command, the daily job and `brain serve` work without it.

## Your values live outside the engine

Put these in `~/.config/brain/web.env`. The engine never holds them.

| Key | What it is |
| --- | --- |
| `APP_HOST` | The name the phone opens, for example `brain.example.com` |
| `MAC_HOST` | The tunnel name for this Mac, for example `brain-mac.example.com` |
| `D1_ID` | The id from `npx wrangler d1 create brain_inbox` |

`worker/write-config.sh` turns `worker/wrangler.example.toml` into `worker/wrangler.toml` (gitignored) from these values. `npm run worker:dev` and `npm run deploy` run it first.

## Worker secrets

Set with `npx wrangler secret put <NAME>` in `worker`: `RELAY_TOKEN`, `SERVER_TOKEN`, `SESSION_SECRET` and `PASSWORD`. For `wrangler dev`, put them in `worker/.dev.vars` (gitignored).

## Calendar feed (optional)

The Worker can serve your to-dos with a due date, and your events, as a calendar feed. Each one shows as an all-day entry.

1. Make a long random secret: `openssl rand -hex 32`.
2. Set it: `npx wrangler secret put CAL_TOKEN` in `worker`. It must be 32 characters or more, or the feed stays off.
3. Run `worker/write-config.sh` again, so `wrangler.toml` sends `/cal/*` to the Worker. Then deploy.
4. In Google Calendar, open Other calendars, then From URL. Paste `https://<your app host>/cal/<secret>.ics`.

Anyone with the URL can read your to-do titles. Keep it private. To turn it off, change or delete `CAL_TOKEN`. Google checks the feed only every few hours, and the Mac must be on when it does. The feed is read only: marking an entry done in Google does not change your brain.

## This Mac

1. `~/.config/brain/relay.env` holds `RELAY_URL=https://<APP_HOST>` and `RELAY_TOKEN=<the same token>`. With it, `ops/setup.sh` loads the 5-minute pull job.
2. Install `cloudflared` and log in with `cloudflared tunnel login`.
3. Run `ops/go-live.sh` yourself. It makes the tunnel, points `MAC_HOST` at it, writes `~/.config/brain/cloudflared.yml`, builds the app, deploys the Worker and re-runs `ops/setup.sh`.

A deploy is public. Agents never run `go-live.sh` or `npm run deploy`.
