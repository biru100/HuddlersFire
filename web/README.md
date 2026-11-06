# Huddlers Fire web application

INT-22 is the current **local-only** source change on protocol v20. Presence uses one immediate button group plus explicitly saved memo drafts; status text appears above campers and work notes appear in People. Mouse dragging captures a free camera, wheel zoom anchors at the pointer, and sitting/follow restore retain the chosen zoom. Dark mode now changes UI while the field stays in color. Radio bubbles have no connector. New profiles start with 25% effects volume, saved mute stays muted, and effects show blocked/loading/failure/retry/playing states. `node tests/browser.feedback.mjs` runs isolated two-browser RTC and real decoded campfire output checks against the loopback QA server; OAuth/YouTube remain fixtures. Published version **37** is unchanged.

Current local source: INT-22 participant feedback on the INT-20 composition polish, `field-polish-v1`, protocol v20. Published version 37 uses protocol v20 and automatic release updates. The project [validation record](../docs/validation.md) owns the implementation and publication evidence. Runtime PNGs live in public/sprites; source recipes, reviewed snapshots and replay tools live at the repository root. Ordinary app builds require no Python or generation service. From the project root, node tools/rebuild-sprites.mjs replays the reviewed field and material package; --legacy explicitly selects the older INT-17 recipe. See [authoring](../docs/sprite-authoring.md) and [lighting](../docs/lighting.md).

The local polish retains camp night lighting and adds a readable follow camera, screen-sized name labels, asymmetric seat groups, varied props/terrain edges, directional idle/movement and six-frame flame loops. Twelve source images were generated while 47 approved originals were reused explicitly. The 43-case review includes actual desktop/mobile UI, video/PIP, 1/3/8/16 campers, frame pages, lighting and WebGL/Canvas recovery. See the validation record for publication status, source receipts and performance limits.

`node tests/browser.night-lighting.mjs` checks actual GPU exposure, world-light/camera invariants and protected/emissive pixels against the loopback material preview. Set `CAMP_NIGHT_BASELINE` to an optional pre-change module URL for the other-map pixel comparison. `node tests/browser.night-metrics.mjs` compares 16-player CPU/GPU and Canvas costs; its report distinguishes mobile viewport emulation from physical phone testing.

The field uses PixiJS 8.14.3/WebGL2 with bounded fire/lantern lights, normal maps, cached soft shadows and adaptive quality. Input and HUD stay on the original Canvas; unsupported or lost WebGL falls back to Canvas with improved shadows/glows. Profile photos and official booth media keep their original colors. The five new material PNGs add 438,605 bytes; all 22 color PNGs are preserved. `npm.cmd run test:browser:lighting` captures the isolated material preview, followed by `test:browser:lighting:ui` for actual desktop/mobile/PIP. `test:browser:lighting:metrics` measures CPU submission, WebGL GPU time and frame intervals separately. See the authoring guide for the preview server and review/install commands; a mobile viewport is not a physical phone benchmark.

`npm.cmd test` and `test:render` preload actual assets using the Node Canvas fixture. The field has 16 action states, four seated body views, 83 total character frames, two bench axes with weathered variants, 33 environment/effect assets and three terrain materials, with six color and six dark character variants. Shared state fields and DB schemas are unchanged; protocol v20 separates the revised seat layout from v19. Dev-only sprite/material preview dependencies are loaded only when their preview environment variables are set.

The INT-15 rebuild is deployed as public version 26 (protocol v17); version 25 was the earlier partial migration. All existing participants must reload before rejoining. Official SEED CLI snippets in seed-design/ui/ provide the actual controls, lists, tabs, selections, status messages and dialog foundations. components/camp/camp-panel.tsx composes SEED Tabs and BottomSheet while preserving drafts. app/camp-layout.css replaces the previous layout, and lib/camp-artwork.mjs owns the newly drawn field objects; SEED is a UI library, not a Canvas game renderer. The old shadcn UI directory and class-inferred control wrapper have been removed.

The browser-local Color/Dark preference originated in INT-16 (public version 27; protocol v17). Color is the default, including legacy settings without a theme. `app/camp-theme.css` defines the two SEED palettes; `lib/camp-theme.mjs` restores the saved preference before first paint and the live setting also follows field/music PIP. Shared controls and SEED dialog integration live in `seed-design/ui/`; RSC/TSX configuration is in `seed-design.json`. INT-22 keeps the Canvas field in color and passes the separate UI theme to nameplates and controls. Direct grayscale rendering remains available for authoring compatibility. External profile/booth images and videos retain their original colors. Portals use △/□/○ labels and distinct line patterns, character tones carry Ⅰ–Ⅵ marks, and fire unlocks use distinct shapes without changing their wire IDs.

After starting the built Worker on 5191 and loopback QA API on 5192, `npm.cmd run test:browser:appearance` checks desktop/mobile tabs, popup stacking, close/focus behavior and screenshots (`outputs/seed-*.png`). `npm.cmd test` includes grayscale Canvas and legacy-profile compatibility checks. Browser tests use disposable headless profiles, never personal browser sessions.

React/Vinext UI, WebGL2 world with Canvas fallback/HUD, WebRTC host topology, Cloudflare Worker HTTP API and D1 lobby storage. See the repository root README for startup and tests.

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

Discord account linking is required to enter; temporary enrollment only prepares OAuth. If keys are absent the Discord link button displays a preparation state and entry remains unavailable. The callback verifies a one-use, session-bound, five-minute state value, exchanges the code server-side, and stores only the Discord ID and avatar URL. Tokens are not sent to the browser or saved. Connecting does not replace the player's chosen nickname. A missing avatar uses the game character as fallback. Unlinking clears stored Discord profile data; an existing room keeps its entry-time profile until the next entry.

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

- `npm.cmd run test:browser:exhibition`: with the built Worker at 127.0.0.1:5191 and loopback `tests/local-immersion-server.mjs` at 5192, checks physical keyboard walking through portals, return travel, proximity-triggered game introduction, official local artwork, links, modal focus/input locking, and mobile radio/dialog separation. Uses a disposable headless profile and a YouTube stub; it does not operate a personal browser or verify real media/NAT/devices. See `../docs/architecture.md` for the current v17 map and portal contract.
- `npm test`: API and feature checks using SQLite and deterministic world simulation, covering lobby/auth plus crouch/emotes, gravity/falls/respawn, carrying/escape/disconnect, chat limits/idempotency, YouTube URLs and queue permissions/playback clocks.
- `npm run typecheck`: TypeScript check.
- `npm run test:render`: calls the real game Canvas renderer via Skia, producing desktop/mobile/action/reduced-motion and crowded-chat/radio PNGs in `outputs/`. No desktop/browser UI is operated.
- `npm run test:network`: with the local server running, creates 16 separate authenticated sessions and real loopback WebRTC connections using Werift. Tests both channels, all-peer snapshots/chat/music, guest movement/poses/emotes, carrying/escape/trampoline/fall/respawn, capacity, reconnect/history and host departure. `CAMP_TEST_URL` can select another **local test server**. YouTube media itself is not streamed by this test.

Browser compatibility, layout/focus interactions, audio playback and real-world NAT traversal remain manual release checks. The automated network test uses Node WebRTC, not a browser engine. There is no computer-use-based verification in this project.

Chat shows messages chronologically with the newest at the bottom. Overhead bubbles avoid one another and prioritize recent speakers when space is limited; the full messages remain in chat. Walk up to the radio and press R (or the nearby touch button) to open “함께 듣는 밤”. Closing the dialog keeps a single visible YouTube player running; the radio bubble shows the shared song title, requester and play/pause state. Metadata lookup failures fall back to the video ID. Personal music/forest volume, radio mute preference and carrying consent live in the Settings dialog and are stored in this browser. F lifts a nearby consenting player, then throws them along the carrier's last movement direction. Throws follow gravity, stop horizontal travel at obstacles, and can bounce on the trampoline or fall off the island. Space escape and consent/disconnect release remain separate from throwing.

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

The first valid request from any participant starts an idle radio automatically, including a request after the queue has drained. Further requests join the queue without restarting the current song or overriding a host's manual pause. The host retains pause/resume, skip and queue removal controls. Automatic starts use the existing shared clock, transport revision, deduplication and coherent recovery; no protocol schema or DB change is required (current protocol v15).

On the mobile field (up to 760 CSS pixels wide), the radio uses a 214px shell with 6px padding, retaining a visible 200×200px player and the title/mute heading. Long guidance is hidden; the PIP row is hidden only when Document PIP is unsupported. Supported PIP controls and playback/error recovery remain available. Desktop and the separate music PIP window retain their existing layout. This follows the [YouTube embedded player size requirements](https://developers.google.com/youtube/terms/required-minimum-functionality#embedded-youtube-player-size); it does not hide the video or introduce audio-only playback.

All members can submit supported HTTPS video URLs; the host manages the transport and queue. The queue holds 30 pending tracks with at most three per requester. Every participant automatically follows playback in a visible official IFrame player (minimum 200 by 200 pixels), without opening the radio or opting in. Each browser keeps its own volume and mute preference. Muting does not stop or destroy the player, affect other listeners, or prevent a muted host from advancing songs. Legacy listening=false is not migrated to mute; the new musicMuted preference defaults to false. The app does not pause playback when the player or tab becomes hidden. Background track-end events still advance the host queue. A browser-imposed hidden-player pause is not broadcast as a room pause; returning to the foreground resynchronizes the shared position and transport. Browser suspension, media restrictions and device sleep can still interrupt playback. Autoplay blocking provides an explicit user-gesture button. Queue entries link directly to the submitted video; this version does not add YouTube search, a Data API key, media extraction or relaying.

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

On entering the camp, choose **YouTube 작은 창** on the player. Supporting browsers open a visible official player in Document PIP. Visibility belongs to the player's own document for foreground recovery and interpreting local transport events; hiding either window does not make the app pause playback. Closing it returns the player at the shared camp position; the player is recreated during transfer. Field and music PIP share the browser's single Document PIP slot. Unsupported browsers retain the original visible player. The opener must remain open, and autoplay/device policies still apply.

Worker wakeups, Window fallback and RTC input events drive the host independently of painting. Up to one second of delayed physics is substepped; longer unprocessed camp time freezes. Scheduler gaps above 250ms withhold host renewal and successor readiness for five seconds, allowing the existing lease/recovery election to replace persistently slow authority. Ambient crackles run inside the looping audio buffer. These changes do not guarantee execution during OS sleep or browser freezing.

`tests/playground.test.mjs` covers ball physics/validation/recovery, work time, delayed stepping, authority health, worker teardown and audio recovery. The headless community test also checks bundled worker execution, quick status/work time, chat order and YouTube PIP with a stub external media API. Real YouTube playback and device sleep remain manual verification items. See [validation](../docs/validation.md) for the current run and deployment status.

## Interaction and panel update (protocol v12)

Working and away no longer grant immunity or block actions. The retired `afkProtected` field is absent from presence, player state and full/delta snapshots. Status changes preserve posture and carry chains. Carry consent, sitting, escape and call/mute preferences retain their independent rules. The array schema changed: old peers must reload when this version is deployed. See [validation](../docs/validation.md) for the public release status; site version numbers and protocol versions are separate.

Chat is the initial panel; people, personal status and play have their own tabs. Invitation details are collapsed. Below 760px, and in field view, the fixed bottom menu opens a panel over the field. Pages remain mounted so drafts and chat reading position survive navigation. Enter opens chat; Escape returns focus to the field. Field labels use compact presence badges, omit them when they would obscure profiles/names/conversations, and open the full player details when selected.

Project intent and evolving decisions live in [project-intent.md](../docs/project-intent.md). Project-only harness routing is in [AGENTS.md](../AGENTS.md); the local planning skill is `camp-plan-interview`. Review and validation skills use the intent document without making old decisions immutable. Moderation and game showcase features remain deferred.

Nameplates render after all world objects and the vignette, so trees, tents, logs and foreground bodies cannot cover them. Nameplate hit testing also precedes body hit testing. Camera transforms, carried/sitting positions, map filtering and personal hiding apply consistently. Zoom uses the mouse wheel over the field (up to enlarge, down to shrink, 75–300%); the old top-left zoom buttons and percentage display are removed. Panel scrolling and Ctrl+wheel are not intercepted. The same Canvas-scoped listener is reattached in field PIP and removed at teardown. Follow-self, whole-view reset and automatic fire focus remain available.


## Separate camp and playground (protocol v13)

Every arrival starts in the camp. Use **놀이터로 가기** / **불멍으로 돌아가기** to move only yourself inside the same room. The camp retains the fire and radio; toys, lifting/throwing, football and trampoline belong to the playground. Movement, sitting, jumps and emotes work in both maps. The people panel shows locations; the field draws and picks only people in your map. Chat, calls, shared radio, personal mute and work time continue across travel.

The host validates map changes and rejects camp attacks or cross-map lifting/hits. Travel releases both sides of a carry chain, safely leaves other members in the original map, clears owned shots and movement, and preserves personal choices/status/call timestamps and weapon cooldown. Falls return to the current map. Full/delta snapshots and host recovery include mapId and a mapRevision input generation, preventing delayed movement from an earlier visit. Ball and weapon state are exclusively playground state. No database migration is required; all peers must reload together after a v13 deployment.

The maps.test.mjs suite checks isolation, facilities, travel/chain cleanup, full/delta recovery, stale input and renderer picking. The loopback network test mixes maps through host succession; the disposable headless community test checks desktop/mobile travel and shared radio continuity. These are local automated tests, not personal browser or desktop control. Deployment status is tracked separately in [validation](../docs/validation.md).


## Log seating and fire immersion (protocol v15)

Approach either side or either end of a camp log and click/tap a seat or press E. Sixteen exclusive seats face the fire. E also moves a ground-sitting player to a nearby empty seat. Intended sitting posture is set before awaiting the seat command so keyup and simulation updates cannot cancel it. Sitting automatically frames the fire and shows recent camp messages above it. Standing, moving, jumping or map travel restores the ordinary view and releases the seat. The shared fire starts with 120 seconds of fuel, fades to embers and accepts 60 seconds of wood from seated players once per person every ten minutes, up to 240 seconds. The remaining personal wait appears on the wood button.

Each successful wood contribution earns the room 1 XP. Every 3 XP unlocks a new level, up to level 5, while total XP continues to accumulate. Any camp participant can choose an unlocked shared appearance: amber, gold, blue, jade or violet. Leveling does not change the current choice automatically. The field and Play panel show shared level, XP progress and the room-wide appearance selector. Fire state, seating, personal cooldowns, growth and appearance survive coherent P2P handoff. A new room starts at level 1; there is no account-persistent growth or DB migration. Protocol v15 rejects invalid XP, unknown or locked appearances and requires all peers to reload together when deployed.

While seated, choose a person in the People panel to hide/unhide their character and overhead messages on your own field. The shared chat remains visible. Hiding applies only while seated, is cleared when leaving the room and does not affect other users. Presence appears above the head. The playground uses a daytime sky, sand/grass, fences and a shade canopy.

The Radio tab and R open music management from anywhere, with personal radio/fire volume and mute. Recorded campfire audio is served from public/audio/campfire.ogg; see public/audio/CREDITS.txt for Glaneur de sons / CC BY 3.0 attribution. No YouTube audio is extracted or relayed.

Server API entry requires Discord linking, including create, join, room polls and signaling. An active member cannot unlink. Public discovery and temporary OAuth enrollment remain available; this does not check membership of a particular Discord server. No new DB migration is required.

For local RTC/browser QA, start the built Worker on 127.0.0.1:5191, then npm.cmd run test:qa-server on 5192. Set CAMP_TEST_URL=http://127.0.0.1:5192 for test:network and test:browser:community. The test-only loopback harness runs the actual API with SQLite and mocks only the external Discord provider; it never adds an auth bypass to the application. The browser uses its own temporary profile and verifies the actual Ogg decoding, while YouTube and Discord consent are fixtures.

Effects controls use effectsVolume for the shared local effects master. The old forestVolume preference migrates without resetting volume or explicit mute. Slider state saves immediately while audio loads/resumes; ambient fire and active wood flares share the same output volume/mute. Radio volume is independent. Stored effects volume is reapplied on reload and starts after a permitted browser gesture.
