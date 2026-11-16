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
   - exhibits: `camp-add-game-booth`
   - product audit: `camp-product-review`
   - affected change/QA: `camp-change-validation`
   - other gameplay/network/platform changes: relevant code, contracts and scoped tests, **not** automatically art
5. Do the smallest verifiable work with exact scope, actual evidence, decision/quality/technical/release gates and rollback.
6. Update `docs/harness/CURRENT.md` and PR/issue handoff on a meaningful change; if you cannot write there, provide the exact content and link to be added. Never presume that Chat, Work, Codex or other tools share memory.

## Current standing decisions (2026-11-16)

- User's **primary** goal is a better overall HuddlersFire experience; art work is a leaf task.
- The NW Idle pilot should show obvious cute breathing at initially 64×96 (adjustable after game review).
- ChatGPT is the concept/key-pose visual partner. Work/Codex may **author or correct derived pixel artwork** within explicitly authorized scope. User retains final aesthetic approval.
- One NW Idle and a minimum layer structure only before scaling directions, movements and customization.
- Protect existing GitHub art originals, existing ChatGPT Sites project/DB/Discord configuration and PR automation. Technical CI is not user art approval. No paid API, destructive migration or unapproved production deploy.

## Quality-oriented reporting

Report (a) what player-facing goal was advanced, (b) what evidence was actually inspected, (c) what remains unapproved/unverified, (d) the smallest next permitted step. When the work is art, show motion/image evidence rather than relying on a count of changed pixels. Other domains have their own appropriate acceptance evidence.

Project-wide intent lives in `docs/project-intent.md`. This skill does not overwrite it, does not edit global agent settings, and cannot itself authorize user-facing deployment.
