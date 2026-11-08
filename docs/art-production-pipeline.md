# HuddlersFire Visual Production Pipeline v1 (2026-11-09)

**Canonical route:** concept generation → pixel master → frame authoring → deterministic composition → technical + art/motion review → separately approved native/runtime delivery.

This document governs new art production. Previous asset registers, masks, design reviews, plan01/02 history, and gameplay data remain immutable. The implementation is an incremental safety layer over the proven CORE03 engine, not a new image generator or an approval shortcut. The current approved NW F1 already exists; do not regenerate or pixelize it merely to make F2.

## Why the old route failed

An image-generation call can return the wrong dimensions, RGB instead of RGBA, or a different character even if the prompt says to preserve F1. A visual reference displayed in chat does not prove the model actually edited the original PNG. A successful masked derivative also cannot prove that the raw image preserved the character outside the mask.

Prior failed F2 outputs, including wrong-size redraws, are **reference-only/blocked**. Never promote, crop, resize, align, recolor, auto-flip or quantize them into valid sources.

## Generic generation / pixel-master audit

New artwork has a distinct concept stage. A real generated source can be hashed and documented as a *reference-only* artifact without being promoted:

    node tools/art-production.mjs audit-concept --source PATH --source-reference ACTUAL_REFERENCE --tool ACTUAL_TOOL

Once an artist has **independently authored** a native pixel master, verify that actual PNG without re-rendering or forced downsizing:

    node tools/art-production.mjs audit-master --source PATH --expected-sha ACTUAL_SHA256 --canvas 64x96

These are read-only evidence checks. They do not produce, auto-pixelize, or approve pixel artwork. New design/animation approval and the native/runtime integration remain separate; existing NW F1 skips concept and master creation.

## Two explicit tracks

| Stage | New art or a new costume | Existing approved F1 → F2/F3/F4 |
| --- | --- | --- |
| 1 Generation | Generate concept candidates for art direction; save unchanged originals, provenance and art critique. They are references, not frames. | **SKIP**. Optional generated wrinkle study is reference-only. |
| 2 Pixel master | Draw/reconstruct an independent native pixel master; check exact bytes/dimensions/alpha/quality, then obtain explicit design approval. Downscaling an illustration is not pixel-master approval. | **REUSE** exact approved F1 1086×1448 RGBA, SHA256 c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a. No remaster or reraster. |
| 3 Frame authoring | After pixel master approval, create individual frame edits from that master, not a series of chained redraws. | Start f2/f3/f4 independently from the same F1. Only paint inside frozen CORE; manual pixel-edit or masked-inpaint. |
| 4 Composition | Keep original and derivative separate; exact RGBA selection only. | Frozen mask 278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d. 4px guard + all outside use F1; inside CORE uses accepted candidate. No feathering. |
| 5 Review | Check pixels, temporal changes, silhouette/pose, and get human art/motion selection. | Predeclared budgets and seam checks plus full 4→1 loop. f2 technical pass is NOT motion approval. |
| 6 Delivery | Only after separate native/runtime/production approvals. | NOT AUTHORIZED. |

**Pixelization is not a fix-up step.** A generated illustration must not be shrunken to 64×96 or filtered into a fake approved source. For a new asset, an artist or actual pixel editor authors a native master with independent review. For the existing NW F1, retain its approved source canvas; native 64×96 conversion is a separate future art-delivery task.

## Stage ownership and immutable evidence

- **Generation:** ChatGPT Images or another explicitly chosen tool may create visual concepts. Keep real model/output claims separate from requested model. The original image file and hash must exist; a textual hash or screenshot is not a binary file. Generation output is not a frame until actual edit provenance and all frame gates pass.
- **Pixel master:** an artist/editor prepares a real approved image. Store the exact source and SHA256. For the active NW job, the only master is existing approved F1. New master approval requires an actual user decision, never code.
- **Frame:** accept actual source PNG, a stage receipt, and the original anchor. Do not falsely assert that a model saw the actual file: input method is *self-attested provenance*, verified hashes prove bytes, not the model's historical operation. If source input is not actually evidenced, mark it unverified/review-only.
- **Composition:** the deterministic existing tools/idle-frames.mjs and tools/lib/idle-composite.mjs execute exact selection. Preserve original PNG even if blocked. Report raw differences excluded outside CORE.
- **Review:** engineering check ≠ artistic approval. No user decision is fabricated. Preserve decision=pending, artApproved=false, animationApproved=false, productionReady=false, runtimeVerified=false.
- **GitHub:** one original per immutable path and matching manifest/hash. Verify actual remote bytes after upload. Avoid duplicate PRs and use the existing art review PR. Do not touch runtime assets, database, existing Sites project, deployment secrets or production.

## Actual CORE03 job / commands

Active set: art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json.
The existing set and original F1/mask remain unchanged. Work on the open review branch, not main.

### Fresh checkout prerequisite

The tracked CORE03 job references design-review runs under ignored `art/sprites/runs/`. A fresh checkout does not contain those local runs, so `status` and `audit-master` otherwise fail with a missing parent `job.json`. Before the commands below, install the locked web dependencies (`npm ci` in `web/`), return to the repository root, and run:

```sh
node tools/restore-rounded02-idle-review.mjs
```

Run restoration only for a fresh checkout with those review runs absent. It verifies the persisted approval-document/source hashes and copies existing design and historical pending-motion evidence into local runs; it creates no new approval, plan confirmation or frame artwork. If runs already exist, verify them in place rather than deleting, overwriting or blindly restoring them again. Use the locked dependencies, not a substituted Canvas version. This preparation does not replace the pinned Pillow setup needed for full frame decoding.

From the prepared repository root:

1. Inspect the state:
   node tools/art-production.mjs status
2. Read-only verification of existing master:
   node tools/art-production.mjs audit-master
3. Obtain **an actual pixel-edited F2 PNG** directly from the original F1. Save it unchanged outside the registered set and prepare a matching stage receipt using docs/briefs/rounded-02/f2-stage-receipt.template.json. A whole-character re-render is not eligible.
4. Read-only frame gate:
   node tools/art-production.mjs check-frame --frame f2 --source /absolute/path/frame02-inhale.png --receipt /absolute/path/f2-receipt.json
5. Only if the result is ready_for_explicit_technical_intake, explicitly register original bytes:
   node tools/art-production.mjs intake-frame --frame f2 --source /absolute/path/frame02-inhale.png --receipt /absolute/path/f2-receipt.json
6. Compose using the existing frozen CORE (still only a derived candidate):
   node tools/art-production.mjs compose-frame --frame f2
7. Inspect:
   node tools/art-production.mjs inspect

Only after F2 survives separate visual review, produce F3 and F4 independently from F1, repeat the same sequence, inspect four transitions, and optionally create the reference sheet:
   node tools/art-production.mjs assemble-reference

For anchor-guard CORE03 jobs, the low-level tools/idle-frames.mjs intake also requires --stage-receipt PATH. Its original registration path now independently enforces the same frame evidence and raw-source gate, so direct calls cannot bypass the split-stage review.

The stage tool performs **no image generation, pixel-art creation, remapping, resize, crop, canvas repair, flipping or RGBA conversion**. It cannot produce F2 pixels by itself. It is an audit/intake/compose coordinator. The existing pinned Pillow decoder is still required for full PNG integrity; run node tools/setup-sprite-gen.mjs in a local environment first. The cheap header gate is not itself a full PNG decode; failures at either stage block.

## New frame-receipt contract

A stage receipt is independent of the repository's original manifest. Required fields:
- version: 1, stage: frame-edit, frame: f2 (f3/f4 afterward)
- technique: manual-pixel-edit **or** masked-inpaint
- inputKind: actual-approved-f1-png
- inputSha256, pixelMasterSha256: exact approved F1 SHA256
- sourceSha256: SHA256 of the **actual output file**, not a requested hash
- planSha256, maskSha256, canvas: exact frozen job values
- sourceReference, editorOrTool: concrete traceable provenance
- operations: one matching operation, no resizing/cropping/flipping/quantization/recoloring/alpha conversion
- all approval booleans false, as they cannot be inferred from the operation

For manual-pixel-edit, any changed original RGBA outside CORE blocks. For masked-inpaint, outside raw changes are disclosed but if more than **1% of outside pixels** differ, the source is blocked as likely a whole-character redraw. This is a new conservative *raw-source intake* rule and does not relax CORE03's existing seam and region-change budgets. The existing exact-selection mask still guarantees frozen derivative pixels.

## Failure / no-fabrication behavior

| Failure | Required action |
| --- | --- |
| Wrong 1086×1448 canvas, RGB/APNG, broken decoder | Preserve original as blocked evidence. Do not resize, crop, convert or register. |
| Reference-only or unverifiable actual F1 input | Keep concept/reference status. Do not call it an edited F2. |
| Rebuilt hair/feet, excessive raw changes outside CORE | Block raw candidate even if the derived composition would hide those changes. |
| Bad CORE seam, too much cloth motion, static duplicate | Block using existing CORE03 checks; do not soften budgets or synthesize replacement frames. |
| F2 passes but F3/F4 missing | Report partial success. No sheet, loop or animation approval. |
| GitHub binary unavailable | Keep local/chat original and report missing remote proof. No fabricated upload. |

The canvas is deliberately **1086×1448** for the approved original. A different generator-native size is not an equivalent delivery. If generation cannot produce or edit this size, use a real pixel editor on the approved canvas rather than treating a resized render as source.

## Minimal testing

From web/: npm run test:art-production; npm run test:idle-frames; npm run test:sprites:pipeline. CI also runs the full existing npm test suite. Tests use synthetic deltas or checksum-only reads; fixtures are never presented as newly generated character art.

At the date of this migration, the live CORE03 job still has only f1 and plan confirmation. F2/F3/F4 real sources, artistic motion approval, native 64×96 and runtime registration remain pending.
