# HF-ART-CLEANROOM-20261118 · New native pixel art process

**State:** user-authorized art-pipeline modification and ZERO-cost local preflight. Specific provider purchases, model generation, final character art, game integration, merge and deploy **not** authorized.
**Why:** HF-ROOT → HF-REST.PRESENCE + HF-PLAY.INTERACTION + HF-WORK.AWARENESS + HF-SHOW.DISCOVERY → HF-Q-VISUAL → a coherent new customizable avatar / gameplay-visible pixel design. This task is one ART leaf, not the global project purpose.

## Most recent user text-only design constraints

- New, original true pixel art **not** AI-looking simulated pixels.
- **Do not use any historic HuddlersFire image/PNG record whatsoever** in making the fresh concept. Historical data is preserved on other branches but not read, conditioned on, attached, or copied from.
- All maps' selected camera is **B, balanced 2:1 quarterview**, not C's changed projection. The user wants **cute casual ~2–2.5 head high characters**, clear modular hair/top/bottom, recognizable emotions/poses.
- Keep current gameplay compatible: idle, walk, sit, carry (including chains), throw, jump, trampoline, balls, fire/camp, work status, exhibition and 16-player readability.
- Native candidate grids **64×96 and 48×64 are both experiments**; neither is approved.
- No asset in existing PR #23 may become the new creative reference without a NEW explicit user decision; do not continue polishing the prior hair/hoodie as a default.

## Work responsibilities, in order

1. Read positive-only `docs/briefs/cleanroom-pixel-generation-20261118.txt`, and `docs/art/pixel-ai-pipeline-v3.md`. Understand technical contracts from relevant JSON keys only, NOT from any old visual references.
2. Verify `art/sprites/cleanroom-pilot/manifest.json` with `node tools/verify-pixel-cleanroom.mjs art/sprites/cleanroom-pilot/manifest.json` and `node --test web/tests/pixel-cleanroom.test.mjs`. If tests fail, fix *within this PR* and rerun at actual head.
3. Audit genuine local tool availability, provider account/model access and costs/licensing. **NO** paid model/API/extra subscription calls, no new connector install. Leave RD Plus lane blocked unless genuinely available and cost-authorized. Pixel Snapper may be considered only if a compatible licensed local executable truly exists, and only on this lane's newly created image.
4. Prepare a short comparable generation recipe (identical positive-only text, neutral pose, subject and readable scale) and candidate acceptance sheet. Limit infrastructure additions: reuse existing registry/catalog, renderer, GitHub/Work. No second global source-of-truth or AI-managed approval table.
5. If an authorized local pixel-creation route can genuinely produce an aesthetically plausible candidate, store exact new output PNG and source/provenance in `art/sprites/cleanroom-pilot/outputs/<lane>/` with native 1× and 4× previews. **Do not claim success with placeholder vector rectangles or simple drawn mannequins.** Record blocked lane honestly otherwise.
6. Report findings on this PR: exact head/CI/test output, actual new assets (if any), no references imported, unavailable providers, remaining blockers, and the smallest next **user G0 visual decision**.
7. After user selects a fresh art direction only: C1 base and 2×2 independent hair/top swapping; then Idle + Carry/Throw motion key poses; then in-game and runtime gates. Do not auto-produce hundreds of frames/props.

**Do not** merge this or PR #23, publish/replace Sites, change current working avatars/Discord photos, touch DB/multiplayer/protocol/collision, use old PNG bytes, buy credits, call unconnected external services, or pass off a technical test as visual approval.

## Completion of THIS scoped request

- The project-local art skill/contract and validated preflight are integrated on a Draft PR.
- User's clean-room constraint survives a new chat/Work context and is not overridden by older "use styleReference" directions.
- Provider availability/price is observed rather than assumed.
- A clean-room benchmark is ready. Actual output remains explicitly marked unrun/blocked unless real PNG evidence exists.

## Work intake and capability audit · 2026-11-18 KST

The source work order was inspected at `f8498160f9754d35b1898fd0531a761bd134f38f`. The current common prompt SHA256 is `b45408f769e3c175f05d877dfb413eb3ec10c8d54da63e327c32ef0a13eca644`. Each available lane must start from that same file, and each native grid trial requires its own drawing.

| Lane | Observed availability and status |
| --- | --- |
| Native model | No callable Retro Diffusion/Scenario connector in this Work environment. Blocked. Account access, cost and output rights have not been verified. |
| General generator plus alignment | A general image tool is exposed, but this task authorizes tool auditing and local preflight. No local Pixel Snapper executable was found. The complete lane remains blocked. No image model invocation occurred. |
| Direct native drawing | GIMP, ImageMagick, Pillow and NumPy are installed. Aseprite, LibreSprite, Krita and Pixel Snapper were absent from PATH. The current inherited conversation already contains previous project artwork. A new design drawn in this context cannot establish the requested fresh creative context, so this lane remains not_run. |

Scenario's official model documentation still specifies 48×48 for walking_and_idle and four_angle_walking. Its Pixel Snapper documentation describes grid alignment and color quantization, with MIT licensing and free commercial/hobby use. A local installation/version or the actual usage rights of model outputs have not been established. No provider account, license purchase or paid call was attempted. Model generation cost remains null because every lane is unrun.

Official capability references checked on 2026-11-18:
- https://docs.scenario.com/get-started/generation/third-party-model-generation/third-party-model-generation-retro-diffusion
- https://help.scenario.com/articles/1753861053-pixel-snapper-the-essentials

The validator now checks the exact six approval keys, canonical lane paths and absence of symlinks. Candidate files reuse the existing PNG intake inspector for static non-interlaced RGB8/RGBA8 PNG, including CRC and scanline validation. Other PNG encodings require a supported decoder before their delivery can be verified. The validator remains a declared-input and file check. It cannot establish that a provider received only the declared inputs, authenticate authorship, or detect undisclosed historical style references.

Next authorized creative step is one independent text-only candidate in a fresh context with no old image history, using the supplied brief and recording actual authorship, rights and cost. After genuine 1×/4× images exist, the user chooses G0 art direction and native grid. No visual gate has been approved.
