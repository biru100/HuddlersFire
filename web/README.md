# Huddlers Fire web application

React/Vinext UI, Canvas 2D world, WebRTC host topology, Cloudflare Worker HTTP API and D1 lobby storage. See the repository root README for startup and tests.

## Local development

Use Node.js 24 LTS. From this directory:

```powershell
npm.cmd ci
npm.cmd run build
# Once per new local database; already applied in the current workspace:
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mean_cobalt_man.sql
npm.cmd run dev -- --port 5173 --hostname 127.0.0.1
```

On macOS/Linux use `npm` in place of `npm.cmd`. The UI and APIs use the same origin. `npm start` previews the built Worker locally. The schema is owned by `db/schema.ts` and `drizzle/`; generate a new migration with `npm run db:generate` after schema changes. Do not replay already applied SQL.

## Discord profile photo

The integration uses the supported website OAuth2 flow and only requests `identify`. It does not access guilds, friends, messages, voice, or email. This is profile linking, not a Discord Activity or native Discord Social SDK build.

Set server-only runtime values:

| Name | Value |
| --- | --- |
| `DISCORD_CLIENT_ID` | Your Discord developer application's client ID |
| `DISCORD_CLIENT_SECRET` | Its client secret |

Register this exact redirect URL with Discord: `https://YOUR_HOST/api/camp/discord/callback`. Local development uses the matching loopback origin. Configure local secrets in ignored `.dev.vars`, and deployed secrets through the hosting service's runtime environment controls. Never put them in `NEXT_PUBLIC_*`, source control, the client bundle, or the hosting manifest.

Users may enter as guests. If keys are absent the Discord link button displays a preparation state. The callback verifies a one-use, session-bound, five-minute state value, exchanges the code server-side, and stores only the Discord ID and avatar URL. Tokens are not sent to the browser or saved. Connecting does not replace the player's chosen nickname. A missing avatar uses the game character as fallback. Unlinking clears stored Discord profile data; an existing room keeps its entry-time profile until the next entry.

## NAT traversal and TURN

Default: public STUN discovery, direct WebRTC connections when the network permits. Before community rollout, configure a TURN service that supports coturn-compatible REST credentials:

| Name | Value |
| --- | --- |
| `TURN_URLS` | Comma-separated `turn:` / `turns:` endpoints |
| `TURN_SHARED_SECRET` | The relay's REST authentication shared secret |

The API issues HMAC-based one-hour credentials. The shared secret stays server-side; clients refresh the ICE configuration before a new negotiation after 50 minutes. An established WebRTC connection carries its own traffic. A TURN relay forwards encrypted packets when direct connectivity is unavailable; it does not become the game host. Without TURN, some mobile/carrier, office and restrictive NAT networks will fail to connect.

## Deployment

`.openai/hosting.json` retains the Sites project ID and declares D1 binding `DB`. The Sites build integration and `worker/index.ts` are retained from the starter. Deployment packages include Worker output, static assets, the hosting manifest and generated D1 migrations. They do not include local state or secrets.

The source directory remains part of the user's original repository. A publication-only source snapshot is staged under ignored `outputs/site-source`; the Sites helper owns its separate Git metadata. Do not initialize a nested Git repository at `web/`.

Sites was confirmed to use a public audience on 2026-11-03. Preserve this existing audience during update deployments unless the owner requests a change. Discord photo linking is independent of the hosting platform's access gate.

This is a server application. Uploading `dist/client` alone to static hosting will not provide sessions, rooms or signaling. D1 data is temporary application state: room cleanup is request-driven, signals expire after two minutes, inactive room hosts after 90 seconds, and guest sessions after seven days. Hosting-platform abuse controls and limits should be selected before unrestricted public use.

## Validation

- `npm test`: API and feature checks using SQLite and deterministic world simulation, covering lobby/auth plus crouch/emotes, gravity/falls/respawn, carrying/escape/disconnect, chat limits/idempotency, YouTube URLs and queue permissions/playback clocks.
- `npm run typecheck`: TypeScript check.
- `npm run test:render`: calls the real game Canvas renderer via Skia, producing five desktop/mobile/action/reduced-motion PNGs in `outputs/`. No desktop/browser UI is operated.
- `npm run test:network`: with the local server running, creates 16 separate authenticated sessions and real loopback WebRTC connections using Werift. Tests both channels, all-peer snapshots/chat/music, guest movement/poses/emotes, carrying/escape/trampoline/fall/respawn, capacity, reconnect/history and host departure. `CAMP_TEST_URL` can select another **local test server**. YouTube media itself is not streamed by this test.

Browser compatibility, layout/focus interactions, audio playback and real-world NAT traversal remain manual release checks. The automated network test uses Node WebRTC, not a browser engine. There is no computer-use-based verification in this project.

## Protocol and constraints

- Signaling uses authenticated same-origin HTTP polling. Offers for different guests are processed concurrently; messages within each guest's negotiation retain their order.
- Guests send direction at up to 20Hz. The host simulates at roughly 30Hz with substeps and sends snapshots at about 15Hz. The `camp` DataChannel is unordered with zero retransmits; snapshots replace previous state. Protocol v2 adds ordered/reliable `camp-control-v2` for posture changes, actions, chat, music, clock sync and acknowledgments. Bounded queues, action IDs, validation/rate limits and chunked history prevent silent control-message loss and duplicate actions on a live connection. Pending actions are rejected on disconnect rather than replayed after reconnect.
- Missing inputs time out after 700ms. Rendering interpolates remote players and predicts local movement. The host validates finite input, speed and world collisions. This cooperative prototype does not prevent a malicious host from falsifying the world.
- Closing the host ends the room. Browser refresh leaves the current membership. Rejoin with the code while the host is present. Host migration, persistent worlds and in-game voice are outside this version. The host retains the last 100 chat messages and music queue in memory, restoring them on reconnect; neither is stored in D1.
- Keep the host tab active. Browser throttling, sleep and suspended tabs can pause its simulation and eventually expire the lobby.

## Shared YouTube

All members can submit supported HTTPS video URLs; the host manages the transport and queue. The queue holds 30 pending tracks with at most three per requester. Each browser opts in to a visible official IFrame player (minimum 200 by 200 pixels) and keeps its own volume/listening preference. Playback pauses locally when the player is hidden or the tab is inactive. Autoplay blocking provides an explicit user-gesture button. Queue entries link directly to the submitted video; this version does not add YouTube search, a Data API key, media extraction or relaying.

Host-monotonic checkpoints and RTT clock estimates support late joins and drift correction. Ended events carry the current track ID to prevent an old event skipping a new song. Ads, buffering, media restrictions and browser policies limit synchronization; exact audio alignment is not guaranteed. Real player/audio behavior needs browser verification.
