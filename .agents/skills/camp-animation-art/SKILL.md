---
name: camp-animation-art
description: "HuddlersFire의 생성/픽셀 마스터/프레임 분리 제작, 승인 F1 기반 CORE03 검증, 원본 보존 및 모션 검토를 위한 프로젝트 로컬 스킬."
---

# Active policy: split-stage visual production (2026-11-09)

The single canonical workflow is docs/art-production-pipeline.md. The NW CORE03 job at art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json is the current pilot. Old plan01/02 materials and their already saved binary files remain immutable history.

## Phase selection

- **New asset:** (1) concept generation → (2) *separately authored* pixel master + design approval → (3) pixel frame editing from that master → (4) masked composition and technical QA → (5) artistic animation review → (6) separately authorized native/runtime application.
- **Existing approved design:** do **not** regenerate or re-pixelize F1. Start from frame editing with the real approved 1086×1448 RGBA PNG. For NW core03, use the exact anchor SHA256 c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a and frozen CORE mask SHA256 278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d.

## Before image editing

1. Read the actual F1 bytes, job, plan, mask, and docs/art-production-pipeline.md. Text references and tool previews are not proof that the generator actually edited F1.
2. For one F2 inhale, move only hood/upper-back cloth folds *inside* the frozen CORE. Head/hair/face/neck, outer sleeves, hands, hem, legs/shoes, camera, view and full position remain locked.
3. Image generation can create conceptual wrinkle references, but reference-only images must never become frame originals. Where the model fails exact size or actual-file edit, use a dedicated pixel editor against the original canvas; never resize or crop its output.
4. Save the real original PNG, raw output SHA256 and frame-stage receipt independently. Distinguish stated source technique from independently verifiable hashes. Never claim generator operation is proven by receipt alone.

## Active commands (project root)

On a clean checkout, install the locked web dependencies using npm ci (from web/) and restore existing reviewed design-parent evidence with node tools/restore-rounded02-idle-review.mjs (from the project root). This does not generate or approve new F2 art. New concept and pixel-master candidates may be checked with audit-concept and audit-master --source/--expected-sha/--canvas, but these read-only commands do not generate or approve artwork.

- Read current stage status: node tools/art-production.mjs status
- Inspect approved source metadata without altering: node tools/art-production.mjs audit-master
- Preflight real F2 original: node tools/art-production.mjs check-frame --frame f2 --source PATH --receipt RECEIPT.json
- Only after eligibility: node tools/art-production.mjs intake-frame --frame f2 --source PATH --receipt RECEIPT.json
- Apply the frozen mask: node tools/art-production.mjs compose-frame --frame f2
- Analyze incomplete/complete motion: node tools/art-production.mjs inspect
- Assemble review-only sheet after all valid frames: node tools/art-production.mjs assemble-reference

Even direct tools/idle-frames.mjs intake for anchor-guard core03 requires --stage-receipt. No alternate intake path may skip validation.

Frame receipt example: docs/briefs/rounded-02/f2-stage-receipt.template.json.
Run node tools/setup-sprite-gen.mjs before full PNG decoding; npm run test:art-production and npm run test:idle-frames in web/.

## Non-negotiable gates

- Exact 1086×1448 RGBA single-frame PNG; no automatic resize/crop/alpha conversion/palette change or alignment.
- F1 source, plan SHA and CORE mask are immutable. A changed plan requires a new versioned set and actual review.
- Manual pixel editing: raw source outside CORE must be identical to F1. Masked-inpaint: report every discarded outside-source change and block if outside drift exceeds 1%; no wholesale redraw hiding behind the mask.
- Composition is exact RGBA selection inside CORE, exact anchor everywhere else including 4px guard. Existing inner-seam and motion budgets are never relaxed after failure.
- F2/f3/f4 each independently derive from the same F1. Do not chain frames or duplicate F1 as missing art. Failed candidates do not authorize sheet/loop.
- Preserve generation and pixel-master stages as separate responsibilities and separately reviewed artifacts. Pixelization means intentional pixel authoring, **not** downscaling a generated illustration.
- All user motion/art choices, native 64×96 conversion, runtime integration, game execution, production deployment, and DB mutations remain **separate approvals**. Technical pass never changes decision=pending, artApproved=false, animationApproved=false, productionReady=false or runtimeVerified=false.

ChatGPT can handle actual art review and connected-file/technical work where tools permit; Codex or any local pixel editor is optional. No paid API or duplicate automation is implied. Never invent unavailable binary handoffs, CI success or motion approval.
