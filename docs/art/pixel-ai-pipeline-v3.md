# HuddlersFire · Intent-first clean-room AI pixel production v3

**Status:** proposal / implementation pilot, 2026-11-18; subordinate to HuddlersFire's global L0–L4 product harness. **No source artwork, game runtime, live Sites, DB or production publishing is approved by this document.** User explicitly requested that new concept work **must not use ANY previous project images or PNG/image records as reference inputs**. Preserve historical source bytes for provenance/rollback without opening or feeding them into this new art process.

## North star and source-of-truth

Goal: maximize the feeling of **purposefully pixel-drawn** art, not maximize image-model fidelity or generate pretty full-screen illustrations. HuddlersFire's actual player experience: cozy social camp, playground with carry/throw/jump/trampoline/ball/bomb interactions, co-working and game exhibition. Casual expressive avatars should stay readable at 1× with 8–16 people and support independent hair/top/bottom swaps.

- Project purpose / latest choices: `docs/project-intent.md` and `docs/harness/INTENT_TREE.md`.
- Technical contracts only: `art/sprites/scene-spec.json.pixelQuarterview`, `art/sprites/pixel-quarterview/catalog.json`, and existing renderer/assembly code. Read **only structural fields** (projection, canvas, anchors, slots, state names, movement constraints) during creative-stage preparation. Historical `styleReference`, lookdev links, PNGs, palette screenshots, previous PR images and previous prompts must not become model inputs, latent-style conditioning, or creative references.
- Production catalog remains the existing catalog; this pilot's metadata is a **temporary experimental receipt**, not a second source-of-truth for approved assets.
- Existing Work/GitHub PR event automation is reused. Do not establish a parallel project-wide harness, duplicate scheduler or autonomous paid generator.

## Clean-room boundary: hard gate

**Before any new design generation**, use the standalone positive-only prompt:
`docs/briefs/cleanroom-pixel-generation-20261118.txt`.

1. Text-only new creative request. No previous HuddlersFire PNG, lookdev, sprite, screenshot, generated sample, palette extracted from old art, old image SHA/path or earlier image reference can enter the prompt or provider request; no previous image-to-image input, seed reuse or training/fine-tuning against project art.
2. Keep all three comparison lanes **independent**. Do not feed lane A's first candidate into lanes B/C, or copy a previous model's derived palette, pose or pixels to make the others pass. After the user chooses a winner, approved NEW art may become the common reference for subsequent directional/animation work. The original clean-room round uses no image inputs.
3. Do not open old PNGs to “check similarity” in the generation context. Historical archives may remain in GitHub and are not authorization to read them. The immutable prior art must not be deleted.
4. Record exactly which model/provider/version, dimensions, seed, prompt SHA256, image inputs (expected empty), output SHA256, license/usage permission and actual cost, or mark `unknown` / `blocked`. Never assert one model was used when only its name was written in a request.
5. Validate the intended image-input contract with `node tools/verify-pixel-cleanroom.mjs art/sprites/cleanroom-pilot/manifest.json` before any optional provider call. This gate blocks accidental old-image injection; **it does not guarantee no resemblance to pretrained images or artistic quality**.

## A/B/C independent acquisition lanes

| Lane | Input → process | Critical limitation |
|---|---|---|
| A: Native pixel model | **Text-only** Retro Diffusion Plus (or another verified licensed native-pixel model) → native PNG candidate → manual cluster inspection | External provider must be connected and explicitly authorized if paid; API/model output sizes must be verified. A proposed call is not an executed model run. |
| B: General model + pixel alignment | Text-only general image model → isolated new concept → pixel-grid alignment/cleanup via Pixel Snapper or equivalent → manual redrawing | Pixel Snapper repairs off-grid pixels but **does not make an unattractive illustration well-designed**. Never claim a pixelation filter alone satisfies art quality. |
| C: Native hand-authored pixel route | Same positive-only text brief → Work/Codex designs shapes directly on native logical grid, optionally using a pixel editor → manual / visual critique | Do not disguise simple generated geometric placeholders, blurry enlargements or low-detail mannequins as final art. Report honest limitations. |

**Budget default is $0; no paid third-party API call, plan subscription, proprietary model install or export to an external account without separate user permission.** If A or B cannot actually run, report as `blocked_provider_unavailable`; proceed with truly authorized local tasks and never fabricate A/B output or a three-way comparison.

**Model note (checked 2026-11-18):** RD Plus is static-pixel oriented. Scenario's RD Animation `walking_and_idle` / `four_angle_walking` are **48×48 per frame**; `small_sprites` is 32×32 and VFX has other constraints. This cannot directly make an approved **64×96** animated avatar. Evaluate output shape and license at run time; it is a later motion candidate only, not automatic stage 1.

Official sources:
- https://docs.scenario.com/get-started/generation/third-party-model-generation/third-party-model-generation-retro-diffusion
- https://help.scenario.com/articles/1753861053-pixel-snapper-the-essentials
- https://learn.scenario.com/playbooks/sprite-sheet-animation

## Minimal first production experiment: aesthetic decision before infrastructure

**One character / one front-three-quarter neutral pose / no old image inputs.** User's current visual preference: approximately **2–2.5-head casual chibi**, true pixel-cluster art, unified full-B balanced quarterview (ground still **2:1**; no C projection change). Compare two *independently authored* logical canvas options: **64×96** and **48×64**. These are test candidates; do not mark either as approved. Do not produce whole scenes, four directions, loop sheets, or many outfits yet.

1. **S0 intent/design brief**: prepare creative prompt only from latest text decisions. Confirm source images / palettes / prior image conditioning = none. Record available tool capabilities and current permissions/cost.
2. **S1 independent candidate**: attempt lanes A/B/C only where the tools are genuinely connected and cost-authorized; at most one small comparable candidate per path/resolution initially. Record unavailable paths as blocked. No automatically generated fake alternative to cover a blocked lane.
3. **S2 pixel audit and artist correction**: check native logical grid, alpha transparency, pixel bounds, coherent cluster shapes, silhouette, material planes, readable face/arms/feet at 1×; unnecessary isolated pixels, stray dithering and uneven grid require explicit review. Do not auto-quantize to six colors or smooth resize.
4. **S3 modular feasibility** (only after user selects promising base): draw one shared neutral body, two truly distinct hairstyles and two tops, and check all four independent assemblies for collar/hand/neck occlusion, unaffected foot anchor, consistent pixel density. Do not force old hairstyle/hoodie, color swaps, or masked-out anatomy.
5. **S4 motion feasibility** (after design approval): one direction at a time; produce neutral, inhale, exhale and **carry/throw keypose** review on the same body and clothing attachment points. Sequence actual pixel clusters, not per-frame image re-generation or RGB interpolation. Read airborne feet vs ground-shadow and release point. Expand only after review of poses.
6. **S5 in-game evidence**: existing renderer's dev-only asset injection, same 2:1 world projection, B follow camera, 1× and integer enlarged panels, night camp and playground actions, seating, 8/16 crowded case, WebGL + Canvas fallback, mobile layout when possible. Preserve Discord portrait and current production assets.

**Visual gates:**
- G0: user chooses art direction, character proportions and native grid from real 1× examples
- G1: user selects coherent pixel base with attractive shape language; no fake AI texture, no old PNG conditioning
- G2: user approves independent clothing/hair swaps and occlusion at 1×
- G3: user approves motion that is not sliding/stretching/flickering; physics actions readable
- G4: separate code/runtime adoption; G5: separate Sites publish (with live-data checks)

CI may verify file provenance, dimensions, deterministic composition, strict alpha/palette when **the chosen style calls for it**, grid alignment, frame anchors, and regression. CI cannot “approve” charm, cuteness, uniqueness, narrative appeal, or whether it looks handmade. Give the user actual pictures/GIFs at G0–G3. Keep previous PR #23 and historical art as **reference history only** without opening it in this experiment.

## First authorized Work deliverable for this PR

- Implement a small isolated receipt/validator for text-only generation and test it with no external calls.
- Audit available local pixel editor/CLI and existing game asset assembly utilities, **without opening old image pixels**. Do not install services or claim a provider is connected.
- Prepare the same positive-only text prompt for all lanes, provider capability/cost summary and clearly marked blocked/not-run statuses.
- If local artist-quality native drawing is genuinely feasible without old references, output ONE candidate and 1×/4× evidence in an isolated path; if not, stop with an honest blocker and a suggested human/creative-review handoff.
- Record exact tested head, test commands, missing parts, next permitted action; **do not merge, deploy, pay, reuse prior image records, or auto-approve anything**. Full pixel sprites, animations and game rebuilds require later user decision.

Scope is an **art leaf** only, not a rewrite of `AGENTS.md` global project intent, gameplay, renderer, network or the general Work automation.
