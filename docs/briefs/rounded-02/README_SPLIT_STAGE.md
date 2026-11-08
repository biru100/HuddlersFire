# NW CORE03 F2 split-stage handoff

Use docs/art-production-pipeline.md as the canonical contract and .agents/skills/camp-animation-art/SKILL.md as the active skill. This note links existing CORE03 artifacts and does not overwrite historic plans.

The pilot is currently **awaiting a genuinely pixel-edited F2 source**. The approved F1, frozen 43,422-pixel CORE mask, reviewed region plan and 1900ms proposed loop are preserved. No F2 source, F3/F4, complete loop, native or runtime approval is produced by this change.

## Concrete files

- Approved F1: art/sprites/source-registry/rounded02-idle-frames-nw-03/base/frame01-anchor.png
- Frozen mask: art/sprites/source-registry/rounded02-idle-frames-nw-03/motion-plan/COMPOSITE_MASK.bin
- Active job and 4px guard: art/sprites/source-registry/rounded02-idle-frames-nw-03/job.json
- Source requests and intent: motion-plan/f2-request.txt, FRAME_INTENT.json and REGION_LOCKS.json in the same set
- Editable receipt template: docs/briefs/rounded-02/f2-stage-receipt.template.json
- Coordinator: tools/art-production.mjs (status / audit-master / check-frame / intake-frame / compose-frame / inspect / assemble-reference)

For the first F2 pilot, actually open/copy F1 in a pixel editor and edit only the existing hood/upper-back folds inside the allowed CORE. Save the exact-size RGBA PNG without any canvas changes. The file must pass the read-only check-frame gate before a source can be explicitly registered. A ChatGPT Images redraw, even in the same style, is not a substitute.

**Safe scope:** all prior original files, plan01/02 history, F1 SHA256, frozen mask SHA256 and the pending motion/production flags remain unchanged; no game run, site deployment, DB change or new paid API.
