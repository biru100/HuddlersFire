# HuddlersFire · cross-context current handoff

## 2026-11-20 · First camp scene review

The active art task is the [scene-first workflow](../art/scene-first-review.md). Inspect the [current candidate, evidence and limits](../../art/sprites/scene-reviews/camp-circle-se/README.md) at actual mobile and desktop scale. The candidate is pending user selection. Character customization and Idle follow selection. Both earlier rejected canvas sizes now have verified file receipts. The older entries below record their respective dates.

**Prepared:** 2026-11-16 KST. **Status:** intent-first harness v2.0 **draft PR [#21](https://github.com/biru100/HuddlersFire/pull/21)** on branch `harness/intent-first-project-v2-20261116`, not merged to main or deployed. Re-check the **current PR head**, GitHub/Work/Sites before treating this as live status.

## Product North Star

Online camp for indie-game developers to **rest, play, co-work and share games together**. The project's harness supports the entire game and the quality of that experience. Sprite creation is one initiative, never the system's center. Canonical decisions: [project-intent](../project-intent.md); mapping: [intent tree](INTENT_TREE.md).

## What is known, not inferred

- Repository: `biru100/HuddlersFire`, default `main`; existing GPT Sites project is `appgprj_6ae8e9ae42708191b253341387aa287f`, DB `DB`. **No new site, DB, Cloudflare direct deployment or unapproved paid image API.**
- [Validation](../validation.md) records the release from [PR #15](https://github.com/biru100/HuddlersFire/pull/15) and documents **v41 publication on 2026-11-09 KST** to the original Site, with non-destructive data checks. This is last recorded verification, **not a live check on 2026-11-16**.
- Prior NW Idle exploration: [PR #7](https://github.com/biru100/HuddlersFire/pull/7) open and conflicted; [PR #19](https://github.com/biru100/HuddlersFire/pull/19) reference 2×2 draft; [PR #20](https://github.com/biru100/HuddlersFire/pull/20) technical 16-frame draft stacked on #7; [PR #17](https://github.com/biru100/HuddlersFire/pull/17) proves Chat PNG transfer, not art acceptance. None of these are approved NW runtime animation.
- Product branches already described in [product direction](../product-direction.md): camp/rest, playground/play, work/status/presence, indie-game exhibits. Cross-cutting visual quality, UX/access, multiplayer reliability and release safety support all of them.

## User decisions newly confirmed 2026-11-16

1. Project harness must follow **L0 product purpose → L1 sub-intents → L2 outcomes and engineering quality → L3 initiatives → L4 tasks**, independent of active chat. Do not optimize the entire harness for a single frame.
2. Current art **pilot**, subordinate to `HF-REST.PRESENCE`: an obviously visible, cute breathing motion.
3. ChatGPT may design concepts/key poses; Work/Codex **may directly edit derivative pixel art and motion**, but **user retains final art approval**.
4. Start with **64×96** native pixels, adjustable after actual game-size inspection.
5. First finish **NW Idle one**; create basic layers first, validate on one character, do not mass-produce views/clothing.

The implementation sequence and intentionally distinct non-art pilot are in [ROADMAP](ROADMAP.md). The player-feedback/quality review method is in [PRODUCT_LOOP](PRODUCT_LOOP.md).

## Current work and proposals

**Project-harness restructuring:** review PR #21 and its current checks. Use the [roadmap](ROADMAP.md) for proposed follow-ups. The next action comes from the current request, an authorized PR/issue, and its verified state. With no authorized action, report the current state without starting a roadmap item.

**Art pilot:** first create a native NW base/controlled key poses, visually review at 1× and in-game, only then generate intermediate frames. The prior 7-PR art-only plan is **superseded as a global roadmap**; task-specific details can be reused after governance review.

## Current explicit restrictions

- Do not replace the approved original binaries with derivatives or promote historical reference art to approved runtime.
- No silent production deploy, database migration/destructive writes, new paid services, site replacement or duplicated Work PR automation.
- Do not claim real-world browser/NAT/Discord OAuth/mobile compatibility from Node loopback CI.
- Do not infer user sign-off from a document, generated image, PR or green test.
- Project-specific changes stay in this repo; the separate personal reusable AI harness is not modified by this initiative.

## Next action for this draft

For PR #21, review the exact head and its checks. Merge authorization remains separate. For other tasks, use the current request and applicable approval record. The older #7 F2 entry in the Work queue describes that branch’s specialized job. It does not select the next project task or authorize the new pilot.

## Scoped art update · 2026-11-18 KST

[PR #24](https://github.com/biru100/HuddlersFire/pull/24) introduces the user-authorized clean-room art pilot. Its [task record](tasks/HF-ART-CLEANROOM-20261118.md) and [pipeline](../art/pixel-ai-pipeline-v3.md) supersede the old-avatar-first sequence for this new design. Preflight verification and tool audit are recorded. Native-model and general-model/alignment lanes remain blocked by unavailable providers/tools. Two new manual-native PNG candidates (48×64 and 64×96) were subsequently submitted on PR #24 and verified from GitHub. Both were visually rejected by the user on 2026-11-18 because they differ substantially from the desired concept. The manual_native receipt records rejected_visual; both files are preserved as rejected history. The submitting author declares text-only independent drawings. Editable layers and the creation script have not been committed, so that creative process cannot yet be reproduced from GitHub. All art/runtime/release gates remain pending. Restore the exact current PR head and its durable Work handoff for technical results. The next art step is a new text-only concept proposal addressing the failed proportions, shading and character appeal. These rejected candidates cannot serve as references or as a basis for parts or animation. No replacement candidate or new provider invocation is authorized by this status update.
