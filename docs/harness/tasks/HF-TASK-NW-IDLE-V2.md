# HF-TASK-NW-IDLE-V2 · Native NW Idle first art pilot

> **LATEST USER OVERRIDE · 2026-11-17 KST · C0/C1 modular avatar base comes BEFORE NW Idle.**
> User feedback: "일단 디자인 수정도 할 필요가 있어 지금 좀 매몰된 경향이 있는데 우리는 커스터마이징이 가능해야해" followed by "그래그래 진행해". User has **not** approved the old single-character NW design, breathing poses, animation, game runtime integration or PR merge. The task is now the **interchangeable avatar base design / proof**, with NW Idle suspended as a later consumer of that base.

**Current authoritative design-task brief:** [Modular Avatar Base v1](../../../docs/briefs/avatar-customization-base-v1.md). It reuses existing `scene-spec.json.pixelQuarterview`, `pixel-quarterview/catalog.json`, and `docs/sprite-authoring.md` contracts rather than inventing a second global avatar system.

**Effective next Work order at this PR head:**
1. Audit actual draft avatar customization slots, render order, palette/save state, and where existing curly hair and sage hoodie are baked into the visible character. Separate observed capabilities from proposals.
2. Make or propose one appealing **NW neutral common base**, plus 2 truly different hair shapes and 2 different top silhouettes, composing all 4 combinations on the same base. Maintain anchors, clean native pixel clusters, hair/neck/collar/waist seams, safe part occlusion and missing-part fallback. Keep current Rounded 02 as one reference preset only. Work/Codex may draw **derived** pixel assets in this authorized review task; do not overwrite originals.
3. Show base, variants and 2×2 swap comparison at **1× and 4×**, plus optional local camp scene, and an honest failure matrix. If a convincing base cannot be authored with current tools, stop and report rather than hiding a failure under code-only passes.
4. Obtain user **C0 modular structure** and **C1 visual/preset compatibility** decisions before making new breathing keys or inbetweens. The old G1/G2/G3 motion gates are **superseded in sequence**, not silently approved.
5. Preserve `profilePhotoMode:'preserve'` and existing Discord photo, current runtime art, online room data and existing Site. **No** server/DB/protocol changes, paid image API, full 4-direction asset production, unapproved merge or live publication.

**Work proof:** when received by the existing PR-event Work task, link current exact head, authored files, independent source hashes, 4 verified combinations and preview evidence; record clearly whether Work actually ran. This is one leaf within the global HuddlersFire intent-first harness, **not** a new project-wide priority.

---

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


## 2026-11-17 KST · G1/G2 round-3 review: timing and authentic pixel-art grammar

**User's latest direct feedback (NOT G1/G2 approval):** The provisional GIF feels oddly slow/relaxed or low-frame-rate, and the visuals look merely *pixel-styled* rather than convincing authored pixel art. This is a request to revise the aesthetic/motion approach, not a runtime or release approval. Preserve the previous and current attempts as review history.

### Verified diagnostic evidence from the Chat review
- The Chat-assembled `huddlersfire_nw_idle_cluster_keyposes_4x.gif` is a **4-display-frame pose-flip diagnostic**, with per-frame holds **550/480/380/480 ms**, looping in **1,890 ms**. It was made from neutral/inhale/exhale source PNGs, NOT from authored inbetweens. The long per-image holds and abrupt pose switches plausibly produce the observed sluggish/stepped motion. Doubling playback FPS by duplicating drawings cannot fix it.
- The three current review-only native images truly have **64×96 RGBA**, binary alpha and **19 opaque RGB colors**, so the limitation is not that they are technically non-pixel images. The user dislikes the **pixel-art language**: tiny highlight/noise-like marks, weak coherent value clusters, irregular contour stair-step patterns and inconsistent light/material readability. A local connected-component diagnostic counted roughly **56% of single-color connected components at size 1–2 pixels**, though this is **not a pass/fail metric** and some isolated details are legitimate.
- The earlier independent cluster redraw did improve pose breadth, but the final timing/appeal is **not yet accepted**.

### Work next scope: refine G1/G2, do NOT force G3 approval
1. **Art first:** revise one native NW character basis and neutral / inhale / exhale **with coherent manually planned 1px clusters**. Define primary shape masses, readable silhouette at 1×, purposeful color ramps per hair/hood/fabric, consistent silhouette stair steps and material planes, selective highlights, and reduced incidental single-pixel sparkle/dither. Keep character identity and warm design; do not simply blur, resample, apply a global pixelation filter, use random noise, or blindly reduce palette to a fixed number.
2. **Motion mechanics:** create a brief timing diagnostic from existing unapproved poses with visibly labeled timings; clearly distinguish **timing-only playback** from actual animation. An exploratory faster hold comparison is allowed as a non-approved review preview, but it must not be represented as the solution or a final loop.
3. **User review assets:** deliver previous vs new at native 1×, nearest-neighbor 4×, and same local camp context. Show why the cluster hierarchy is more convincingly pixel-art authored. Preserve native frames as separate PNG files and original lookdev binaries unchanged. Report concrete improvement and remaining weaknesses.
4. **G1/G2 gates:** ask user to approve/revise the native character and the key-pose intent separately. **No full new motion loop until G1/G2 approval.**
5. **After explicit approval, proposed G3 production:** design around **6–10 distinct actually authored inbetweens**, not repeated holds or RGB crossfades. Prepare a 1.3-second and a 1.7-second timing candidate (starting suggestions subject to visual testing) with deliberate movement/settle/small anticipation across head, hoodie, arms and lower-body response. Ensure the intended pixel cluster rearrangements are sequential, legible at 1× and stable at 4×; no breathing as isolated upper-body scale.
6. Existing safety gates remain: review-only, no automatic art approval, no merge, no runtime replacement, no Sites publication or paid image API.

**Success is aesthetic:** Does this now *read like intentionally authored pixel art* and *move with a natural, not sluggish, breathing rhythm*? Green CI, color counts and SHA evidence alone do not answer either question. Include actual GIF timing/duration/frame count and exact PR head in Work evidence. Avoid changing the project-wide harness in response to this one art review.
