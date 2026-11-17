# HuddlersFire · Modular Avatar Base v1 · review-only design brief

**Status:** User-requested design/pipeline direction, 2026-11-17 KST; no avatar art or runtime customization is approved by this document.
**Intent ancestry:** HF-ROOT → HF-REST / HF-PLAY / HF-WORK (recognizable personal presence and self-expression) + HF-Q-VISUAL / HF-Q-ACCESS → HF-I-PRESENCE-ART → PR #23 modular avatar-base pilot.
**Latest user feedback:** Current NW Rounded 02 animation iterations became over-focused on one curly-haired, sage-hoodie character. HuddlersFire needs characters players can customize. Reconsider base design first; the next task is **not** to complete the existing NW breathing loop.

## Scope and sources of truth

- This brief specifies **a focused design test**, not a second avatar schema. Reuse **`art/sprites/scene-spec.json.pixelQuarterview`** for tentative 2:1 projection, NW direction, 64×96 logical canvas, foot/head/seat anchors (all user-unapproved production targets), and layer order `back_hair,base,bottom,top,face,front_hair,headwear,accessory`.
- Reuse **`art/sprites/pixel-quarterview/catalog.json`**, its `variants.NW.idle` frame/layer/anchor contract, and **`docs/sprite-authoring.md`** for draft avatar choices: `{version:1,parts:{base,hair,top,bottom,headwear,face,accessory},palettes,profilePhotoMode:'preserve',scope:'local-draft'}`. Do not copy these into competing authoritative schemas.
- Existing user-selected Rounded 02 NW/SE **lookdev** PNGs are immutable design references, **not** a user-approved common base, production native set or mandatory default hairstyle/outfit. The older 64×96 NW idle candidates in this PR remain review-only history.
- This pilot must not be confused with fully available 4-direction, 4-action or online multiplayer customization. No DB migration, network/protocol change, actual player replacement, permanent profile data or production feature unlock is authorized.

## Design problem to solve

1. **Body and silhouette should remain appealing with different hairstyles and outfits**, not only the original curly hair + sage hoodie. Establish neutral underlying head/shoulder/torso/arm/hip proportions so a different hairstyle or top fits without creating holes or unnatural seams.
2. **Part ownership:** base owns underlying head/body/skin visibility, top owns top/sleeves/neckline, bottom owns trouser/leg portion (shoes may remain in bottom for this limited existing schema), and back/front hair are separate drawings. Make optional face/headwear/accessory sockets **specifications**, not mandatory production content now.
3. **Occlusion:** keep back hair and front hair on appropriate sides of neck, top and head; define local mask/overlap rules for collars, hood, sleeves, waist and hair. A particular large hood must not be baked into the base neck, and clothes cannot inherit a single hairstyle silhouette.
4. **Stable anchors and scale:** share foot/head/seat, canvas, projection and character center across draft variants; the 64×96 and (32,88)/(32,28)/(32,62) targets are provisional until actual in-game 1× review. Avoid extracting an invented hidden nude body from a fully clothed lookdev.
5. **Pixel-art grammar:** author coherent native logical-pixel contours, readable masses and purposeful shading at 1×. Do not pass off downsampling, blur, random noise, blanket dithering or a simulated pixelation filter as hand-designed sprite art.
6. **Future movement:** document how hair/top/bottom parts can use the same NW idle frame timing and per-frame anchors when animation is later authored. Do **not** make a motion rig that only works with the original hoodie or demand actual 4-direction animations before the base review.

## Requested Work sequence (do not skip the first gates)

### A. Audit before drawing
- Inspect existing `scene-spec`, `catalog`, avatar editor/draft implementation and current renderer; identify what is truly reusable and what is only proposed/untested.
- Diagnose the current PR #23 character at native 1×: which boundaries are bound to original hair, hood and proportions, which layers are cosmetic versus independent, and what breaks when changing hair/top.
- Record a short inventory of current controls and **genuine** unsupported states. Do not label draft UI palettes as approved recoloring or local draft storage as online customization.

### B. Modular base and 2×2 proof
- Propose one simple attractive **NW neutral common avatar base** with consistent pixel proportions and intended clothing/hair mounting boundaries, separated from hairstyle and garment. The original Rounded 02 appearance may be one assembled preset, not the base itself.
- Author or prepare **at least 2 visibly distinct hair variants** (e.g. original curls + a genuinely different silhouette) and **2 structurally distinct tops** (e.g. hooded + non-hooded) in review-only derived files; test all **4 independent combinations** on the same base. Both differences should be more than simple color tints. Keep a single bottom for this proof. If art tools cannot produce convincing modular art, **report the blocker and offer concept/structural proposals**, not fake a successful 2×2 proof.
- Test hair toggles and top toggles **independently**. Verify no gaps at scalp/neck/shoulders, no collar clipping, no part-order artifacts, stable foot contact/height and a sensible fallback for missing parts.
- Create comparison for **base-only** (as neutral underlying mannequin/design study, not claimed final playable look), original assembled look, alternative hair on same top, alternative top on same hair, and all 4 combinations with slot labels. Avoid a sex-specific/realistic anatomical drawing from the covered lookdev.
- Preserve the existing design's warmth/cuteness without forcing all combinations to retain its exact curly/hoodie silhouette.

### C. Deliver user-visible quality evidence
- Provide **native 1×** and nearest-neighbor 2×/4× comparisons plus isolated **existing campsite night lighting** at the same world position, including original lookdev-based preset versus at least one other combination. Actual game render only if run and verified; no synthetic claim.
- Include a swap/occlusion matrix (at least hair × top), annotated attachment points and exact original/derived PNG hashes/provenance. Reuse existing review/catalog format for production-bound work; put candidates in a **new review-only path** and do not overwrite historical PR #23 files.
- Run applicable art-registry, pixel, layer-composition, and renderer/unit tests at the exact current PR head; state browser/mobile/runtime tests not executed explicitly.

## Visual gates and completion

**C0 (architecture/representation, user review):** Are the attachment points, proportions, editable parts and layering a promising common avatar, rather than a single outfit cut into chunks? Show the contract and failure cases.
**C1 (aesthetic and actual swap, user decision):** Does the NW common base and **all 4 combinations** remain attractive, recognizably belonging to HuddlersFire, and clean at 1×? User chooses/requests revisions. Merely passing a PNG/hash test is not approval.
**C2 (motion after C0/C1):** Only after the user approves the modular base and swap behavior, author new neutral/inhale/exhale keyposes with shared hair/top motion contracts; then user motion review, then distinct inbetweens. **Stop the existing single-character G1/G2/G3 progression** until C0/C1.
**C3 (separate future rollout):** Other directions, walk/sit/emote, avatar UI save, multiplayer sync, runtime adoption and Sites publication are separate scoped work with independent tests and user authorizations. No claim they exist now.

## Non-negotiables

Existing Sites/DB/Discord auth and profile-photo behavior preserved; `profilePhotoMode:'preserve'` remains respected. No automatic merge or production publish. Do not modify global AI harness or invent new paid image services. Old lookdev and all prior review asset bytes immutable. This document is a **subordinate art/design brief** and never redefines the project-wide HuddlersFire intent-first harness.
