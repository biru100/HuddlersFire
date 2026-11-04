# Huddlers Fire web application

React/Vinext UI, Canvas 2D world, WebRTC host topology, Cloudflare Worker HTTP API and D1 lobby storage. See the repository root README for startup and tests.

## Local development

Use Node.js 24 LTS. From this directory:

```powershell
npm.cmd ci
npm.cmd run build
# Only for a NEW, empty local database. For an existing DB, inspect applied schema first:
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mean_cobalt_man.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_magical_lucky_pierre.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_wild_rogue.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_true_nextwave.sql
npm.cmd run dev -- --port 5173 --hostname 127.0.0.1
```

On macOS/Linux use `npm` in place of `npm.cmd`. The UI and APIs use the same origin. `npm start` previews the built Worker locally. The schema is owned by `db/schema.ts` and `drizzle/`; generate a new migration with `npm run db:generate` after schema changes. Do not replay already applied SQL.

The default `.wrangler/state` and isolated validation databases are separate. The latest read-only check found `title` and `visibility` missing from the default database; it was not modified by the intent/UI work. Check the target database with `d1 execute ... --command "PRAGMA table_info(camp_rooms)"` and apply only its missing migration. Do not infer default or hosted migration state from a successful isolated test. Protocol v12 adds no database migration.

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

This is a server application. Uploading `dist/client` alone to static hosting will not provide sessions, rooms or signaling. D1 data is temporary application state: cleanup is request-driven, signals expire after two minutes, inactive memberships after 90 seconds, and guest sessions after seven days. The host lease is 20 seconds, followed by automatic successor election and WebRTC negotiation. Hosting-platform abuse controls and limits should be selected before unrestricted public use.

## Validation

- `npm test`: API and feature checks using SQLite and deterministic world simulation, covering lobby/auth plus crouch/emotes, gravity/falls/respawn, carrying/escape/disconnect, chat limits/idempotency, YouTube URLs and queue permissions/playback clocks.
- `npm run typecheck`: TypeScript check.
- `npm run test:render`: calls the real game Canvas renderer via Skia, producing desktop/mobile/action/reduced-motion and crowded-chat/radio PNGs in `outputs/`. No desktop/browser UI is operated.
- `npm run test:network`: with the local server running, creates 16 separate authenticated sessions and real loopback WebRTC connections using Werift. Tests both channels, all-peer snapshots/chat/music, guest movement/poses/emotes, carrying/escape/trampoline/fall/respawn, capacity, reconnect/history and host departure. `CAMP_TEST_URL` can select another **local test server**. YouTube media itself is not streamed by this test.

Browser compatibility, layout/focus interactions, audio playback and real-world NAT traversal remain manual release checks. The automated network test uses Node WebRTC, not a browser engine. There is no computer-use-based verification in this project.

Chat shows messages chronologically with the newest at the bottom. Overhead bubbles avoid one another and prioritize recent speakers when space is limited; the full messages remain in chat. Walk up to the radio and press R (or the nearby touch button) to open “함께 듣는 밤”. Closing the dialog keeps a single visible YouTube player running; the radio bubble shows the shared song title, requester and play/pause state. Metadata lookup failures fall back to the video ID. Personal music/forest volume, listening preference and carrying consent live in the Settings dialog and are stored in this browser. F lifts a nearby consenting player, then throws them along the carrier's last movement direction. Throws follow gravity, stop horizontal travel at obstacles, and can bounce on the trampoline or fall off the island. Space escape and consent/disconnect release remain separate from throwing.

## Protocol and constraints

- Protocol v9 retains host-authoritative P2P and adds schema-ordered full snapshots, independent deltas against each peer's confirmed checkpoint, bounded receive caches and resync. Discrete commands keep reliable responses; their state notifications coalesce at the next network tick. Full coherent recovery checkpoints remain at 1 Hz. Normal host exit drains the last checkpoint for up to 1.2 seconds; page termination remains best effort. All participants must reload together.
- `npm.cmd run test:metrics:p2p` runs the production codec/receipt/queue path with simulated channels against frozen v8 broadcast rules. See `../docs/p2p-network-benchmark.md` for scope and results. It does not measure Internet bandwidth, browser frame rate, or real-device CPU performance.

- Signaling uses authenticated same-origin HTTP polling. Offers for different guests are processed concurrently; messages within each guest's negotiation retain their order.
- Guests send direction at up to 20Hz. The host simulates at roughly 30Hz with substeps and sends snapshots at about 15Hz. The `camp` DataChannel is unordered with zero retransmits; snapshots replace previous state. Protocol v2 adds ordered/reliable `camp-control-v2` for posture changes, actions, chat, music, clock sync and acknowledgments. Bounded queues, action IDs, validation/rate limits and chunked history prevent silent control-message loss and duplicate actions on a live connection. Pending actions are rejected on disconnect rather than replayed after reconnect.
- Protocol v3 adds authoritative throw velocity and direction to snapshots. The existing reliable channel name is retained so older clients can receive the version-mismatch message; all participants must reload together after this update.
- Protocol v4 carries song titles and restores saved carrying consent in the reliable handshake before other players can lift the joining guest.
- Protocol v5 adds a bounded running flag and reliable jump commands, with preparation and landing timestamps. The host validates running speed and jump eligibility. Space jumps from the ground and releases a carried player; E sits, Shift runs, and C crouches. All participants must reload together after this update. Selecting a player opens a local information dialog and does not change the proximity-based carry target.
- Protocol v6 adds host-owned toy weapons, bounded projectile/effect snapshots, shared fire cooldowns and nonlethal knockback. Press 1 for the toy gun, 2 for snowballs, 3 for bombs, or 0 for empty hands. Aim with the mouse and press J or right-click; left-click still opens player information. Touch controls fire along the last movement direction. Q followed by 1–6 still chooses an emote while that menu is open. All participants must reload together.
- Protocol v7 adds authoritative host epochs, automatic host migration, full recovery snapshots and chains of up to 16 players. F can lift the root of an existing chain or catch an airborne player within 1.05 horizontal units and 1.3 height units, including when the catcher is airborne. A carried root cannot be stolen. F with a passenger throws that upper chain; Space detaches the player and their upper chain. Consent remains per player. Cycles and competing grabs are rejected. Stack height is bounded and the renderer fits tall chains while moving carried nameplates beside the photos. All participants must reload together.
- Protocol v8 validates a shared snapshot/recovery contract and acknowledges complete checkpoints (world, matching music revision and latest chat ID). After connection grace, host renewal requires recent validated game receipts from an active peer; one isolated guest does not rotate a host receiving receipts from others. Candidate eligibility compares checkpoint epoch and camp time against the server's confirmed watermark, so an isolated old snapshot is excluded without aging everyone out during a shared outage. No eligible recovery means waiting, rather than a silent obsolete restore. Three unconfirmed handoffs stop automatic rotation while several participants remain; a lone survivor can still proceed. All participants must reload together.
- Gun shots travel straight, snowballs follow gravity, and bombs explode after 1.6 seconds with a visible range marker. Hits bounce players away without health, death or scoring. Bombs can push their owner. Jump height and scenery affect hits; carried pairs separate on impact. Falling off the island uses the existing respawn. Cooldowns and projectile caps are checked by the host, and changing toys does not reset the cooldown.
- Missing inputs time out after 700ms. Rendering interpolates remote players and predicts local movement, except during an authoritative throw. The host validates finite input, speed and world collisions. This cooperative prototype does not prevent a malicious host from falsifying the world.
- Closing or refreshing the host hands the same room/code to the earliest fresh participant, prioritizing participants with a received world snapshot. An absent heartbeat expires after 20 seconds; negotiation adds reconnect time. Atomic server election increments the epoch, and stale epochs cannot renew authority, signal or update the world. An unresponsive successor is skipped on its lease expiry. A lone survivor can keep playing. Empty rooms are deleted.
- Recovery uses the newest confirmed, coherent reliable checkpoint with its matching chat (last 100 entries) and music queue. Inputs and unresolved commands are cleared. The camp clock freezes until the successor's checkpoint is acknowledged so flight, respawn, emotes, weapon cooldowns, bomb fuses and music resume from recovered time. An abrupt failure can lose changes newer than the last confirmed checkpoint. Recovery state remains in participant memory; a room cannot survive everyone leaving. Persistent worlds and in-game voice are outside this version.
- Keep tabs active during play. Browser throttling, sleep or suspension can pause simulation and cause automatic host succession. A returning former host follows the current server-selected authority.

The 20-second lease follows a 5-second game-receipt health window, and reconnect negotiation adds time; recovery is not instantaneous. Music playback suspends locally during handoff and seeks back to recovered camp time on resumption. Encoding rounds position/velocity/direction to four decimal places without mutating authoritative physics. Unchanged volatile snapshots are suppressed while reliable checkpoints continue once per second. Room maintenance is gated at 15 seconds or an expired lease; regular polls do not repeat all expiry/deletion queries. See [`../docs/architecture.md`](../docs/architecture.md) for module boundaries and measured scenarios.

## Shared YouTube

All members can submit supported HTTPS video URLs; the host manages the transport and queue. The queue holds 30 pending tracks with at most three per requester. Each browser opts in to a visible official IFrame player (minimum 200 by 200 pixels) and keeps its own volume/listening preference. Playback pauses locally when the player is hidden or the tab is inactive. Autoplay blocking provides an explicit user-gesture button. Queue entries link directly to the submitted video; this version does not add YouTube search, a Data API key, media extraction or relaying.

Discord linking uses a separate OAuth window and a dedicated completion route, preserving the current room and host. Completion messages are checked against both the expected window and same origin. Connected/disconnected avatars update existing room membership. New app setup is documented in [`../docs/discord-setup.md`](../docs/discord-setup.md); actual provider consent remains a manual check after server credentials are configured.

Host-monotonic checkpoints and RTT clock estimates support late joins and drift correction. Ended events carry the current track ID to prevent an old event skipping a new song. Ads, buffering, media restrictions and browser policies limit synchronization; exact audio alignment is not guaranteed. Real player/audio behavior needs browser verification.

## Public rooms and working together (protocol v10)

The lobby lists public rooms (20 per page, refreshed every 10 seconds while visible). New UI rooms default to public; creators can select an unlisted invitation room. Existing rooms migrate to unlisted. Membership in a Discord community is not checked. Public discovery exposes only the room summary; joining rechecks capacity and session authorization. Empty/expired rooms disappear; room metadata survives host succession.

Presence is explicit: available, working or away, with a 40-character status and 80-character work memo. The away protection introduced in v10 was removed in v12: working and away follow the normal interaction rules. Carry consent remains independent; sitting players cannot lift or be lifted. Calls honor opt-out and sender/recipient cooldowns, are retained with chat in the recent 100-entry history, and include a real timestamp. History recovery does not ring old calls again.

Field view hides the sidebar behind its panel button. Zoom, self-follow and reset share the same coordinate transform used for picking and aiming. Document PIP moves only the field; networking and music remain in the opener. Closing PIP returns the field without leaving. Closing the opener ends this session. PIP availability depends on the browser; field view works without it. Native desktop always-on-top behavior and mobile background execution still require device testing. Voice feasibility is recorded in [voice-options.md](../docs/voice-options.md).

`npm.cmd run test:browser:community` runs an isolated headless Chromium profile against a local server (`CAMP_TEST_URL`, default `http://127.0.0.1:5191`). Set `CAMP_TEST_BROWSER` for another Chromium executable. It never attaches to personal browser tabs. Screenshots go to `outputs/community-field-browser.png`, `outputs/community-panel-browser.png` and `outputs/community-mobile-browser.png`. This is automated test execution, not desktop or personal browser UI control.

The v10 schema requires the new 0003 migration once per database. It was first applied to a separate local validation database and is now applied to the hosted DB by the Sites version 11 deployment. Do not replay it against that database. All connected clients must reload together when upgrading the protocol.

## Ball, work timer and background resilience (protocol v11)

Walk into the football to kick it; running kicks harder. The host simulates drag, scenery rebounds and out-of-bounds return. Full/delta snapshots and coherent host recovery include the ball. No new database migration is needed. All room participants must reload together after upgrading the protocol.

Chat is chronological with the latest message at the bottom. Reading older messages keeps the scroll position and exposes a latest-message button. Quick presence buttons change manual status; v12 removes the old protection behavior. Personal work time accumulates only while working during the current visit, including background time. It survives connection/host changes in the page, pauses for available/away, and resets on leaving or reloading; it is not a permanent activity record.

Enable listening, then choose **YouTube 작은 창** on the player. Supporting browsers open a visible official player in Document PIP. Visibility belongs to the player's own document, so hiding the opener does not pause a visible music window. Closing it returns the player at the shared camp position; the player is recreated during transfer. Field and music PIP share the browser's single Document PIP slot. Unsupported browsers retain the original visible player. The opener must remain open, and autoplay/device policies still apply.

Worker wakeups, Window fallback and RTC input events drive the host independently of painting. Up to one second of delayed physics is substepped; longer unprocessed camp time freezes. Scheduler gaps above 250ms withhold host renewal and successor readiness for five seconds, allowing the existing lease/recovery election to replace persistently slow authority. Ambient crackles run inside the looping audio buffer. These changes do not guarantee execution during OS sleep or browser freezing.

`tests/playground.test.mjs` covers ball physics/validation/recovery, work time, delayed stepping, authority health, worker teardown and audio recovery. The headless community test also checks bundled worker execution, quick status/work time, chat order and YouTube PIP with a stub external media API. Real YouTube playback and device sleep remain manual verification items. See [validation](../docs/validation.md) for the current run and deployment status.

## Interaction and panel update (protocol v12)

Working and away no longer grant immunity or block actions. The retired `afkProtected` field is absent from presence, player state and full/delta snapshots. Status changes preserve posture and carry chains. Carry consent, sitting, escape and call/listening preferences retain their independent rules. The array schema changed: old peers must reload when this version is deployed. See [validation](../docs/validation.md) for the public release status; site version numbers and protocol versions are separate.

Chat is the initial panel; people, personal status and play have their own tabs. Invitation details are collapsed. Below 760px, and in field view, the fixed bottom menu opens a panel over the field. Pages remain mounted so drafts and chat reading position survive navigation. Enter opens chat; Escape returns focus to the field. Field labels use compact presence badges, omit them when they would obscure profiles/names/conversations, and open the full player details when selected.

Project intent and evolving decisions live in [project-intent.md](../docs/project-intent.md). Project-only harness routing is in [AGENTS.md](../AGENTS.md); the local planning skill is `camp-plan-interview`. Review and validation skills use the intent document without making old decisions immutable. Moderation and game showcase features remain deferred.
