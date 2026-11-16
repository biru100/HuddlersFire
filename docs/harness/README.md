# HuddlersFire · Project-wide intent-first harness v2.0

> **Status: project-wide harness v2.0 merged to main in [PR #21](https://github.com/biru100/HuddlersFire/pull/21), 2026-11-16.** It is an entry point, not permission to alter user intent, autonomously merge PRs, replace runtime art or publish. Canonical user decisions remain in [project-intent](../project-intent.md).

## Why this harness exists

The harness serves **the complete HuddlersFire game and community experience**, not a sprite, frame, model, subsystem or current PR. HuddlersFire is an online camp where indie-game developers can **rest together, play, work alongside one another and share their games**. Every technique, assistant skill, test, subproject and task is subordinate to that experience.

The NW Idle animation is the **first art-pipeline pilot**, **not the root objective**, a universal production recipe or the default work assigned to an agent.

For Chat-authored work dispatch through the **existing** GitHub PR-event Work automation, use [Chat→GitHub→Work handoff](../automation/CHAT_PR_HANDOFF.md). Do not equate PR creation with Work execution.

## Read-first contract for any new chat, Codex session, Work run or agent

1. Select the source ref before reading. Use the current default branch for ordinary work and the exact head for named PR reviews. If you have only a GitHub connector, open the same files at that ref. Start from [AGENTS.md](../../AGENTS.md) or this page if the environment does not load repository guidance automatically.
2. Read [project intent](../project-intent.md): user-approved intent, decisions, supersessions, scope and explicit exclusions.
3. Read [intent tree](INTENT_TREE.md): L0 purpose → L1 experiences → L2 outcomes/quality → L3 initiatives → L4 tasks. The tree points to product/technical records; it does not replace them.
4. Read [current handoff](CURRENT.md): dated verified state, work in progress, unresolved decisions and next **authorized** action. Recheck GitHub main/PR/head/CI and existing Sites state before reporting current facts.
5. Select **only the relevant domain**: [product direction](../product-direction.md), [product review](../product-review.md), [architecture](../architecture.md), [validation](../validation.md), art/asset skills, game booths, network, UI, deployment or other project-local instructions.
6. Apply the [work protocol](WORK_PROTOCOL.md) to the task; write a purpose-linked result and handoff before exiting.

**No live chat context is assumed to be shared between Chat, Work, Codex and other AI environments.** GitHub is the portable durable record; links, actual source/commit/PR IDs and user decision records must be explicit. A file, PR, or generated plan is not proof of user approval or deployment.

## Ownership and source-of-truth boundaries

| Question | Authoritative place |
|---|---|
| What did the user approve, change, postpone or reject? | `docs/project-intent.md` and exact cited user decision, newest applicable decision takes precedence |
| What experience do we want, and what is intentionally out of scope? | `docs/product-direction.md` |
| What are the current code contracts? | `docs/architecture.md`, code, deployed configuration where observable |
| What was actually tested or deployed? | `docs/validation.md`, exact-head CI and verified Sites records |
| What should this agent work on? | `docs/harness/CURRENT.md` + applicable issue/PR + explicit user request |
| What assets truly exist and are approved? | GitHub immutable original registry + source hashes + individual review records |
| What can Work automate? | `docs/automation/POLICY.json`, `docs/automation/AGENT_HANDOFF.md`, active user-authorized workflow |

Never silently rewrite one source using assertions from another. Mark each claim **confirmed decision**, **verified observation**, **proposal**, **blocked**, **superseded**, or **unknown**.

For the cross-domain rollout use [ROADMAP](ROADMAP.md); for experience-driven improvements use [PRODUCT_LOOP](PRODUCT_LOOP.md). Neither document silently authorizes new features or production changes.

## Project-wide rules

- Product quality is not equivalent to technical correctness. Validate the **intended player experience** and its corresponding implementation, then integrity, regression and operations. Keep the evidence and gate types separate.
- Route tasks by impact, not by recent conversation focus. An RTC bug should not be forced through a sprite gate; a visual change should not be released merely because CI passes.
- A local art skill must not become a global product policy. Preserve specialized reusable procedures as leaf skills.
- Do not create new services, paid image API calls, external Cloudflare deployments, DB migrations or publish to Sites without the existing explicit safety/approval conditions. Keep the current site, DB, Discord/OAuth and existing art rollback.
- No blanket application of CORE03 frame locks to unrelated artwork or gameplay. Never promote a reference asset to runtime by metadata alone.
- Do not alter global user/Codex/harness settings. This is a **repository-local** project harness. Personal reusable AI harness work is a separate project.

## How to continue across contexts

Use the handoff template in [WORK_PROTOCOL](WORK_PROTOCOL.md), update [CURRENT](CURRENT.md) when meaningful state changes, link the exact PR and source/evidence. If the handoff and code disagree, verify before continuing; do not assume one is current. If your environment cannot access the repo or artifacts, report that as a blocker rather than reconstructing history from guesses.
