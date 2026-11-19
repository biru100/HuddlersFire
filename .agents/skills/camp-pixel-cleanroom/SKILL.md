---
name: camp-pixel-cleanroom
description: "Use for HuddlersFire's NEW true-pixel-art direction, native pixel candidate comparisons, independent modular-avatar trials, and clean-room visual provenance. Do NOT activate for non-art tasks or historical art recreation."
---

# Clean-room native pixel production · HuddlersFire v3

**Parent:** project-wide HuddlersFire intent-first harness, NOT a new root policy. Purpose: more appealing, consistently hand-authored-looking true pixel art for a social camp with movement, carry/throw, customization, rest, co-working, and exhibitions.

## Active workflow · 2026-11-20

Use the [scene-first workflow](../../../docs/art/scene-first-review.md) for the current character-and-camp assignment. Use each job’s three fresh text briefs, verify its own receipt, and review one actual-size scene on both viewports. The dated steps below apply to the separate 2026-11-18 three-lane job.

## Critical current user decision · 2026-11-18

**ZERO historical PNG/image-record references in NEW concept generation.** Do not open old HuddlersFire source-registry image bytes, source palettes, prior character PNGs, screenshots, lookdev boards, rendered sprite frames, old model image input, old prompt styles or extracted image colors. This rule remains even if historical material was previously approved. Keep old bytes unchanged and independently archived. Model pretraining itself cannot be erased or claimed to be excluded.

Use ONLY the positive text brief `docs/briefs/cleanroom-pixel-generation-20261118.txt` as initial creative generation input. Inspect existing `scene-spec.json.pixelQuarterview` and pixel catalog **only for nonvisual software contracts**, not for visual samples or legacy style fields. The later product visual choice of **B balanced quarterview**, existing 2:1 world basis, casual ~2–2.5 heads, and modular avatar slots comes from latest USER TEXT, not existing image files.

## Required first steps

1. Read the current user request, `docs/project-intent.md`, `docs/harness/README.md` and project-wide work protocol. Then read [scoped pipeline](../../../docs/art/pixel-ai-pipeline-v3.md) and [task handoff](../../../docs/harness/tasks/HF-ART-CLEANROOM-20261118.md); do not read old art previews, lookdev image records or old PNG before fresh generation.
2. Run `node tools/verify-pixel-cleanroom.mjs art/sprites/cleanroom-pilot/manifest.json` before any provider input. The gate checks the prompt has no historical reference, no image inputs and no paid-call authorization. It is NOT a quality verdict.
3. Audit which of three **independent text-first lanes** are genuinely available and authorized: A native pixel model (Retro Diffusion Plus candidate), B general image model + conditional grid alignment (Pixel Snapper/other), C direct native pixel drafting/editor. Do not install or run paid third-party models without user consent. Record `blocked_provider_unavailable` instead of fabricating outputs. No A→B→C cross-reference while comparing them.
4. Make just ONE small independent trial per feasible lane (and separate 64×96 vs 48×64 grid only if native art is independently redrawn, not resized). A concept is never called a final sprite.
5. Review 1× with the player in the balanced camera frame before 4× enlargement. Reject fuzzy grid, isolated detail noise, inconsistent shading/shape, stiff anatomy and basic geometry drawn to pass a script. Check actual eye/hand/foot/wardrobe modularity and carry/throw readability.
6. Only after **user-selected new base** may you generate matching alternative hair/top parts and motion key poses, then controlled sprite inbetweens. Always keep independent asset/binary hashes, model IDs actually used, costs/license, stage, and explicit approval boundaries.
7. Preview in isolated CampRenderer only if available. No runtime replacement, GitHub merge, Site publication, DB/Discord change or new automation without distinct permission.

## Source + approval separation

The current production sprite catalog and scene spec remain authoritative for technical contract after an asset is approved. Clean-room manifest is only a **preflight/review receipt**. Green CI cannot establish visual attractiveness or that a model ran; a valid file must exist and hash-match. Final art selection is always by the user. For final animation evaluate real distinct frames, contact shadows, throw direction, carried character offset, and non-scaling motion.

## Workflow handoff

Existing GitHub PR opened/synchronize event should route the scoped task to existing Work. Summarize with exact PR head, real model/provider availability, runs vs blocked lanes, source and output checksums, visual evidence, and next user review. Never assume a PR creation itself proves Work executed.

This skill applies ONLY to newly authorized art. For unrelated gameplay/UX/network/booth tasks load their own skills. For explicitly resumed OLD art history use the historical local skill without importing those image references into this clean-room branch.
