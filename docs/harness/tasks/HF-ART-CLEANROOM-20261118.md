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
