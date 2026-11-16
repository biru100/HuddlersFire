# HuddlersFire · cross-context current handoff

**Prepared:** 2026-11-16 KST. **Status:** intent-first harness v2.0 **draft**, not merged to main or deployed. Re-check GitHub/Work/Sites before treating this as live status.

## Product North Star

Online camp for indie-game developers to **rest, play, co-work and share games together**. The project's harness supports the entire game and the quality of that experience. Sprite creation is one initiative, never the system's center. Canonical decisions: [project-intent](../project-intent.md); mapping: [intent tree](INTENT_TREE.md).

## What is known, not inferred

- Repository: `biru100/HuddlersFire`, default `main`; existing GPT Sites project is `appgprj_6ae8e9ae42708191b253341387aa287f`, DB `DB`. **No new site, DB, Cloudflare direct deployment or unapproved paid image API.**
- [Validation](../validation.md) and [PR #14](https://github.com/biru100/HuddlersFire/pull/14) document **v41 publication on 2026-11-09 KST** to the original Site, with non-destructive data checks. This is last recorded verification, **not a live check on 2026-11-16**.
- Prior NW Idle exploration: [PR #7](https://github.com/biru100/HuddlersFire/pull/7) open and conflicted; [PR #19](https://github.com/biru100/HuddlersFire/pull/19) reference 2×2 draft; [PR #20](https://github.com/biru100/HuddlersFire/pull/20) technical 16-frame draft stacked on #7; [PR #17](https://github.com/biru100/HuddlersFire/pull/17) proves Chat PNG transfer, not art acceptance. None of these are approved NW runtime animation.
- Product branches already described in [product direction](../product-direction.md): camp/rest, playground/play, work/status/presence, indie-game exhibits. Cross-cutting visual quality, UX/access, multiplayer reliability and release safety support all of them.

## User decisions newly confirmed 2026-11-16

1. Project harness must follow **L0 product purpose → L1 sub-intents → L2 outcomes and engineering quality → L3 initiatives → L4 tasks**, independent of active chat. Do not optimize the entire harness for a single frame.
2. Current art **pilot**, subordinate to `HF-REST.PRESENCE`: an obviously visible, cute breathing motion.
3. ChatGPT may design concepts/key poses; Work/Codex **may directly edit derivative pixel art and motion**, but **user retains final art approval**.
4. Start with **64×96** native pixels, adjustable after actual game-size inspection.
5. First finish **NW Idle one**; create basic layers first, validate on one character, do not mass-produce views/clothing.

The implementation sequence and intentionally distinct non-art pilot are in [ROADMAP](ROADMAP.md). The player-feedback/quality review method is in [PRODUCT_LOOP](PRODUCT_LOOP.md).

## Active proposal, not a silently approved backlog

**Project-harness restructuring:**
- A: establish project-wide intent router, decision provenance, current state and context handoff contract. Do not rewrite unrelated gameplay or deploy.
- B: align existing project-local skills (art, network/QA, game-booth, product-review) to intent-first routing without imposing global pixel gates.
- C: build a small evidence-driven task/initiative queue linked to intent and current code; prioritize by player value, user direction and risk. Preserve existing Work automations.
- D: use NW Idle as **one pilot** to verify the system can produce an appealing result with user-approved art and no unintended runtime change.
- E: evaluate how the same protocol works for a non-art task (e.g. existing network/UX/booth QA), then finalize the harness.

**Art pilot:** first create a native NW base/controlled key poses, visually review at 1× and in-game, only then generate intermediate frames. The prior 7-PR art-only plan is **superseded as a global roadmap**; task-specific details can be reused after governance review.

## Current explicit restrictions

- Do not replace the approved original binaries with derivatives or promote historical reference art to approved runtime.
- No silent production deploy, database migration/destructive writes, new paid services, site replacement or duplicated Work PR automation.
- Do not claim real-world browser/NAT/Discord OAuth/mobile compatibility from Node loopback CI.
- Do not infer user sign-off from a document, generated image, PR or green test.
- Project-specific changes stay in this repo; the separate personal reusable AI harness is not modified by this initiative.

## Next authorized action

Review this **draft** with the user, reconcile the instructions and current branch after review, then commit the intended project-wide harness changes to `main` through an explicitly reviewed PR. Only then treat the new entrypoint as default for fresh contexts. Do not merge or deploy solely because this document exists.
