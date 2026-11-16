# HuddlersFire · project-wide harness v2.0 rollout

**This replaces the previous 7-art-PR proposal as the overarching roadmap.** The NW Idle plan remains an isolated, subordinate art workstream. These items are suggested implementation packages; their presence does not authorize production changes.

## Project harness, not a sprite factory

| Package | Purpose | Artifact | Exit evidence |
|---|---|---|---|
| H-0 · Baseline and intent | Trace user-approved L0–L4 intent; preserve decisions and existing operating boundaries | `docs/project-intent.md`, `docs/harness/README.md`, `INTENT_TREE.md` | References correct, oldest conflicting art rules explicitly superseded, no lost original |
| H-1 · Universal work router | A new context recognizes UX, gameplay, network, exhibition, art, platform and operational requests | `AGENTS.md`, project-operator skill, `WORK_PROTOCOL.md` | Both art and non-art tasks produce purpose-linked plans and evidence |
| H-2 · Durable handoff | Save current decisions, pending gates, code/PR/CI truth and next authorized action | `CURRENT.md`, issue/PR handoff format | Another context can continue without transcript assumptions and finds stale information |
| H-3 · Domain boundaries | Keep production methods, risk gates and tests inside domain-specific skills | relevant local skills and automation handoff | No art-frame check required for non-art task; no global skill or user settings changed |
| H-4 · Art pilot | Produce one valuable NW Idle in native pixels, show visible cute breathing and obtain aesthetic approval | art-only implementation PR(s), motion + game-size previews | Attractive, stable loop approved; exact byte QA independent |
| H-5 · Non-art pilot | Verify the same routing works for an **already authorized** gameplay/UX/network/exhibit fix or scoped audit | a non-art issue/PR with experience parent | Product goal, evidence and handoff work without art assumptions |
| H-6 · Product loop | Capture actual user feedback, impact, constraints and resulting decisions across product areas | [product loop](PRODUCT_LOOP.md), product-review/validation updates | A user-centered acceptance record, not only technical CI |

**H-0/H-1/H-2 are the current documentation proposal.** Do not mark H-3 through H-6 complete or auto-run user-facing changes just because this roadmap exists.

## Workstreams should stay independently usable

- **Experience: rest & presence:** campsite atmosphere, seats, expressive campers, gentle animation, clear chat.
- **Experience: play:** playground reactions, readable interactions, safety between rest and play.
- **Experience: work:** presence/status, notes, audio, return-to-camp continuity.
- **Experience: showcase:** booths, videos, discovery, game information.
- **Shared quality:** visual consistency, mobile/desktop accessibility, WebRTC/recovery, performance, release/data safety.
- **Development operations:** intent tracking, GitHub original assets, CI and Work handoffs, preview and rollback.

When planning an initiative, decide its parent experience and expected improvement first. No workstream is automatically higher priority merely because a model generated many files for it.

## Proposal for PR/issue organization

1. **Project governance PR** (current draft): H-0/H-1/H-2 documentation, root router, agent guidance. No application logic, no data modification.
2. **Domain adoption PR(s)**: adjust each relevant existing skill with domain-specific gates only where necessary. Keep small PRs.
3. **Evidence/task loop PR**: add simple task metadata/validation if demonstrably useful; reuse existing queue, do not spawn duplicated automations or parallel state ledgers.
4. **Art pilot PR(s)**: native NW, key poses, controlled animation, in-game QA, separate user art and runtime approval. Start from main; old CORE03/16-frame branches are historical reviews, not a base.
5. **Non-art pilot PR**: select a real authorized change and validate continuity and product benefit. No dummy feature for a passing test.
6. **Review and simplify**: trim redundant documents/checks; update the entrypoint and close or preserve stale art PRs with reasons, never erase immutable sources.

The exact next PR, task priority and release scope depend on the user request and latest verified state. Publication always follows the existing Sites and data-preservation authorization process.
