# NW Idle core plan 03: ChatGPT pre-execution preparation

# Current route (2026-11-09)

New creation/intake defaults are now in [split-stage art production](../../art-production-pipeline.md) and the [active project art skill](../../../.agents/skills/camp-animation-art/SKILL.md). This file preserves the existing CORE03 preflight and does not authorize whole-character generation, forced resizing, or runtime use. The existing approved F1 is a reusable pixel master; new F2 starts as a true F1-based pixel edit. Run node tools/art-production.mjs status, audit-master, and check-frame before any intake.

ChatGPT owns this preparation and image/art review. Codex is optional. No main merge, game start, runtime artwork replacement or public deployment is part of this task.

## New explicit contract

- Preserve exact approved f1 and all historical originals/plans.
- Narrow the envelope to the central hood/back interior. The four-pixel inner guard belongs to f1.
- `COMPOSITE_MASK.bin` selects the eroded CORE only. Copy supplied RGBA inside CORE; exact f1 RGBA everywhere else. No blending, feathering, interpolation, resizing, realignment, recoloring or redraw.
- Preserve generated originals and derivatives separately. Report discarded raw guard/outside differences. A stable derivative does not certify the entire generator output.
- Check canvas, profile, inner seam, region budgets, protected pixels and loop before assembly. Keep failures; never repair them silently.
- Start with a genuine f2 pilot. Generate f3/f4 separately from the same f1 only after the pilot is suitable. Never invent missing frames or reuse a test fixture as artwork.

## Reproduction

```sh
node tools/prepare-idle-core03.mjs
node tools/idle-frames.mjs inspect --job art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json
```

The preparation restores existing documented design parents if absent and records the actual scoped plan review. It creates no source artwork for f2/f3/f4. The new per-frame request explains anchor-sourced guard pixels. Legacy plan01/02 requests stay unchanged.

## Evidence and limits

The new core tests cover legacy compatibility, discarded source differences, unchanged guard/protected pixels, seam and region-budget blockers, single-frame request scope, and exact selection against the real approved f1 with a clearly synthetic test delta. Synthetic tests are not animation artwork.

A temporary read-only CI snapshot was used for local verification because this chat container cannot resolve github.com. Temporary snapshot/preparation helpers are removed after use. No production secrets are requested. Native conversion, real loop approval, runtime and deployment remain separate gates.
