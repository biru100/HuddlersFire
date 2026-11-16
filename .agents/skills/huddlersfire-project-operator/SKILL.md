---
name: huddlersfire-project-operator
description: "HuddlersFire 프로젝트 전반의 사용자 의도를 복원하고, 휴식·놀이·작업·전시 목표를 실제 기능/아트/UX/네트워크/운영 작업으로 연결할 때 사용하는 프로젝트-로컬 라우터."
---

# HuddlersFire intent-first project operator

This is the **parent project skill**, not an animation skill. **Do not** invoke a sprite pipeline simply because the project recently worked on NW Idle. This skill routes work to the smallest relevant existing domain skill.

## Mandatory context restoration when joining the project

1. Read `docs/project-intent.md`, then `docs/harness/README.md`, `docs/harness/INTENT_TREE.md`, `docs/harness/CURRENT.md`.
2. Read the **current user request** and exact authorized task/PR. Review actual source, relevant `docs/product-direction.md`, `docs/architecture.md`, `docs/validation.md` only as necessary. Date-check claims and head CI.
3. Link the task to the L0 purpose, applicable L1 experience(s), L2 outcome, L3 initiative and L4 action. If the direct request is operational or bug-fix, connect to affected quality/experience; do not invent product vision.
4. Route to relevant project-local skill:
   - visual quality / concepts: `camp-art-direction`
   - sprite/native animation: `camp-animation-art`, `camp-sprite-assets`
   - exhibit implementation: `camp-add-game-booth`; exhibit UX review: `camp-product-review` and the exhibit contract
   - product audit: `camp-product-review`
   - affected change/QA: `camp-change-validation`
   - other gameplay/network/platform changes: relevant code, contracts and scoped tests, **not** automatically art
5. Do the smallest verifiable work with exact scope, actual evidence, decision/quality/technical/release gates and rollback.
6. Update `docs/harness/CURRENT.md` and PR/issue handoff on a meaningful change; if you cannot write there, provide the exact content and link to be added. Never presume that Chat, Work, Codex or other tools share memory.

## Decision and approval sources

Use [project intent](../../../docs/project-intent.md) for authorized direction, [CURRENT](../../../docs/harness/CURRENT.md) for the last recorded state, and [automation policy](../../../docs/automation/POLICY.json) for existing automated permissions.

## Quality-oriented reporting

Report (a) what player-facing goal was advanced, (b) what evidence was actually inspected, (c) what remains unapproved/unverified, (d) the smallest next permitted step. When the work is art, show motion/image evidence rather than relying on a count of changed pixels. Other domains have their own appropriate acceptance evidence.

Project-wide intent lives in `docs/project-intent.md`. This skill does not overwrite it, does not edit global agent settings, and cannot itself authorize user-facing deployment.
