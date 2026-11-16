# HF-TASK-NW-IDLE-V2 · Native NW Idle first art pilot

**Task state:** authorized to prepare **review-only art candidates**, not to auto-approve art or adopt production assets. **Created:** 2026-11-16 KST, user explicitly requested Chat to hand this task directly via GitHub into the existing Work PR event.

## 0. Project intent, not global project direction

- **L0:** `HF-ROOT` (online camp for indie developers to rest, play, co-work and show games together)
- **L1:** `HF-REST`, people should feel the company of each other even when idle
- **L2:** `HF-REST.PRESENCE`, `HF-Q-VISUAL` (cute breathing makes a camper look alive without unwanted shifting or changing identity)
- **L3:** `HF-I-PRESENCE-ART` (character liveliness/visual coherence)
- **L4:** `HF-TASK-NW-IDLE-V2` (one NW breathing idle candidate and verifiable pixel production path)
- This is ONE art task in the **project-wide** harness. Never rewrite generic user intent or force NW Idle gates onto unrelated gameplay/network/UX.

## 1. User-confirmed creative decisions, 2026-11-16

1. Motion: **clearly visible, cute breathing**, not barely perceptible RGB variation.
2. ChatGPT may design concepts/key poses; **Work/Codex may directly author and edit derived pixel art, layers and motion within this task**. The **user exclusively decides final visual acceptance**.
3. Start native **64×96** logical pixel pixels and revise only after actual 1× game-size visual review if needed.
4. Pilot: **one character, NW Idle only**. Do not mass-produce SE/NE/SW or Walk/Sit/Emote.
5. Build a **basic layered composition** first. Validate on this character before customization expansion.

## 2. Authorized source of design, not native animation

Approved lookdev originals are already in the actual GitHub source registry:
- NW `art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png`; documented SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`, 1086×1448 RGBA.
- SE same directory `se-approved.png`; SHA256 `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2` (consistency reference only).
- `art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json`, `docs/reviews/2026-11-07-rounded02-rev2-art-approval.md`.

**First independently verify actual current-branch source bytes and SHA256.** The selected 1086×1448 lookdev is a DESIGN REFERENCE, not a ready-made native sprite; never overwrite, resize/quantize/crop and claim native pixel art success. Prior locked CORE03 F1/F2/16-frame and generated 2×2 studies (#7, #17, #19, #20) are rejection/technical histories only, NOT approved idle motion.

Read `art/sprites/scene-spec.json` (pixelQuarterview avatar proposed canvas [64,96], feet [32,88], head [32,28], seat [32,62]) and `art/sprites/pixel-quarterview/catalog.json`; anchors/palette are production TARGETS subject to visual review, not already approved.

## 3. First Work delivery: review-only native base + key-pose concept

Work/Codex, when the existing PR event really runs:
- Confirm PR latest exact head and source, read project harness `docs/harness/README.md`, `INTENT_TREE.md`, `WORK_PROTOCOL.md`, `CURRENT.md` and relevant art skills. **Do not rely on Chat transcript.**
- Audit existing sprite authoring tools; use the smallest reusable, deterministic method to **create a native pixel-art base deliberately at the target grid**, not a degraded resized original. Prefer true authored silhouette/shape, consistent direction, warm palette, clear hood/hair/clothing and clean transparency. If pixel editing tools lack artistic production capability, report a real blocker; don't fake "approved" or use a coarse procedural body substitute.
- Prepare the **single NW neutral base candidate** with minimum modular layers (e.g. body, back/front hair, top/hood, lower body; only layers actually needed). Keep the original 1086×1448 separate. Register derived assets with their true provenance as `review-only` at new immutable candidate paths and record hashes and authored method.
- Create separate **neutral / inhale / exhale review key-pose candidates** if the base is visually coherent, so that the user can compare range of movement. Keep feet grounded; allow controlled shoulder, torso, hood, hair or arm micro-movement when meaningful; avoid random whole-body redraw, flicker or only RGB-value changes. A visible motion silhouette is more important than a large frame count. These are UNAPPROVED samples.
- Show native **1×**, nearest-neighbor **2× / 4×** previews, side-by-side pose comparison and (if the existing renderer can produce it safely) actual campsite night-scene preview using a **dev-only flag**. If a real in-game preview cannot be generated, state that explicitly.
- Run existing appropriate source-provenance, pixel/art, typecheck and relevant browser/renderer tests on the **actual changed head**; report what is not runnable, not fake browser screenshots.
- Commit review candidates/receipts and evidence only to THIS PR branch. Update PR with exact tested head and a clear user review request. Do **not** auto-merge or publish.

### Explicit STOP GATES
- **G1 native base:** user must select or reject the actual visible candidate; no automatic native-base aesthetic approval.
- **G2 key poses:** user must approve pose intent/amplitude; do not produce a full 4–8-frame loop before this approval.
- **G3 complete loop:** later user review of motion stability, timing, consistency and 1× game readability; separate from code CI.
- **G4 runtime adoption:** separate user authorization after gameplay QA.
- **G5 Sites publication:** separately authorized, to the SAME existing Sites project only after data/Auth safety checks.

Work may prepare the G1/G2 review material; it must not silently cross those gates.

## 4. Explicitly out of scope

No new image paid API, hosted generation service, global AI setting, new Work automation, new Site/DB, production deploy, Discord/OAuth change, database migration, unapproved PR merge or branch cleanup. Preserve existing runtime art, rollbacks and original PNGs. Do not create fake animation by repeating the same neutral frame.

## 5. Evidence and handoff

When work runs, attach to this PR:
```
[HUDDLERSFIRE HANDOFF]
Goal/intents: HF-ROOT → HF-REST → HF-REST.PRESENCE → HF-I-PRESENCE-ART → HF-TASK-NW-IDLE-V2
PR/head tested:
Verified original SHA256:
Review candidates and 1×/2×/4×/in-game visuals:
Test/CI with exact head and limitations:
Actual changed files:
Art approval: pending user decision
Runtime adoption: pending
Production publish: pending
Blockers:
Next authorized step:
```

**Current task-file creation and passing GitHub CI do not prove Work ran, produced visuals, obtained user approval or completed an animation.** A separate Work event result/PR commit or comment is required to claim actual handoff execution.

## 2026-11-17 KST · G1/G2 revision from user review

The first pose study was returned for revision. The user observed that the
upper-body motion read as resizing. The next comparison uses separately
authored pixel clusters for neutral, inhale and exhale. The hair ends, neck,
hood folds, cuffs, arms, hem, knee creases and shadow edges react together.
Keep the foot contact pixels fixed. Compare the same three poses at 1× and 4×
and in the isolated camp render.

Current review evidence: [pose comparison](../../../art/sprites/incoming/nw-idle-v2-cluster-review-20261117/pose-comparison.png),
[camp Canvas comparison](../../../art/sprites/incoming/nw-idle-v2-cluster-review-20261117/camp-pose-comparison.webp)
and [provenance and checks](../../../art/sprites/incoming/nw-idle-v2-cluster-review-20261117/REVIEW.json).
G1 and G2 await separate user decisions. The earlier study remains review
history. G3 loop work opens after key-pose approval.
