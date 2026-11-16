# HuddlersFire · cross-context current handoff

**Verified/reconciled:** 2026-11-16 KST. **Harness v2.0 is merged to main** via [PR #21](https://github.com/biru100/HuddlersFire/pull/21), merge commit `fa893e1e650f4f0dfedf0dd439471ba16d3f3e6e`. The existing enabled PR-event automation `Automation_a98133b716dc8191b3f1e8d04bdaa12a` was updated to the project-wide intent-first dispatch prompt (tool reported success 2026-11-16). The matching GitHub [CHAT_PR_HANDOFF](../automation/CHAT_PR_HANDOFF.md) documentation is a **new review-branch proposal until merged**. Do not claim that an event triggered Work solely because this text exists; verify live PR head, Work run and Sites separately.

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

**Project harness:** PR #21 has merged; reusable intent-routing guidance is on main. Work dispatch is being reconciled to the same root purpose via the existing automation, not a new automation. Task selection requires the user's current request, explicit authorization, current PR head and scope. Product-level improvements are not automatically authorized by a roadmap.

**Art pilot:** first create a native NW base/controlled key poses, visually review at 1× and in-game, only then generate intermediate frames. The prior 7-PR art-only plan is **superseded as a global roadmap**; task-specific details can be reused after governance review.

## Current explicit restrictions

- Do not replace the approved original binaries with derivatives or promote historical reference art to approved runtime.
- No silent production deploy, database migration/destructive writes, new paid services, site replacement or duplicated Work PR automation.
- Do not claim real-world browser/NAT/Discord OAuth/mobile compatibility from Node loopback CI.
- Do not infer user sign-off from a document, generated image, PR or green test.
- Project-specific changes stay in this repo; the separate personal reusable AI harness is not modified by this initiative.

## Next authorized actions and gates

1. Finish review of Chat→GitHub→Work workflow documentation and its matching automation settings. The automation prompt update is **saved**, but event delivery/Work execution needs real PR evidence.
2. The user has authorized the initial **NW Idle native pixel pilot** as a separate task. In a new dedicated PR, inspect and reuse only verified original lookdev bytes; prepare one provisional 64×96 neutral NW base and key-pose review. No new Chat-generated PNG exists automatically, and original sources may not be replaced. Work/Codex may author derivative pixel assets; ask the user to approve the native design and actual breathing poses before generating a full loop.
3. Keep PR merge, game runtime art adoption and existing GPT Sites production publication pending distinct permission. The old #7 F2 work queue is specialized historical context, not a default next task.

The next chat/Work/Codex context must inspect exact current main and all open PRs before acting; this file is a dated handoff, not live status.
