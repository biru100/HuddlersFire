# HuddlersFire · Chat → GitHub PR → existing Work → user review

**Effective operational contract proposed on 2026-11-16.** This is a **project-wide** handoff, not a sprite/image handoff. It reuses the *existing*, enabled "HuddlersFire 전역 개발 PR 자동 인계" automation (original ID `Automation_a98133b716dc8191b3f1e8d04bdaa12a`), with its existing GitHub pull_request opened/synchronize event. The GitHub event is the transport. Writing a PR does **not** itself prove the event was delivered or Work executed.

## Why this exists
Users can ask ChatGPT to improve HuddlersFire without manually copying large prompts into another Work chat. ChatGPT records the scoped, user-approved work order in the same GitHub repository; the existing Work PR-event automation can pick it up, verify it and continue. No background or direct Chat-to-Work conversation access is assumed.

## First: restore product intent
Before starting or interpreting any PR, read:
- `AGENTS.md`, `docs/project-intent.md`
- `docs/harness/README.md`, `INTENT_TREE.md`, `WORK_PROTOCOL.md`, `CURRENT.md`
- `docs/automation/POLICY.json` and `AGENT_HANDOFF.md`
- Task-specific domain docs, actual source/CI/PR evidence.

L0 HuddlersFire purpose → relevant L1 rest/play/work/show experience → L2 outcome/quality → L3 initiative → L4 bounded task. A subtask (e.g., NW Idle) never becomes global project priority by being the latest PR.

## Chat author: how to hand off

1. Interpret the user's current request and existing approved decisions. Don't invent source permissions, art approval, release authorization or missing assets.
2. Choose the smallest meaningful deliverable and its domain. Ensure it is not already underway in another open PR, issue or Work run.
3. Make a fresh scoped branch based on verified `main`. Add a concrete task contract under `docs/harness/tasks/<task-id>.md` using [the task template](../harness/tasks/README.md), and only authorized additional changes. Link user-selected original sources by immutable GitHub blob/commit and SHA.
4. Open **one** PR against `main` (draft for pending review/approval). Include `[HUDDLERSFIRE HANDOFF V2]` in the PR body with intent path, scope, authorized actions, forbidden actions, evidence, current head, required approval gates and next Work action. The PR opened event is the *intended* dispatch signal.
5. Confirm the PR number/head and any GitHub Actions run. **Do not report Work started or completed** without an observable Work run, PR report/comment, commit, or other provider evidence. PR event delivery may be unavailable, delayed, deduplicated, or blocked.
6. Chat continues as planner/reviewer: fetch updated PR and evidence, ask the user for decisions at gates, and publish only after distinct explicit approval. Never repeatedly open duplicate PRs just to force automation.

## Work receiver: on opened/synchronize

1. Verify exact PR URL, open state, latest head, diff, authorizations and current GitHub CI. Read the handoff and project intent from that ref. If triggered by own commit, deduplicate by task + stage + head to avoid loops.
2. Classify domain first:
   - **Art/assets:** real original PNG bytes, provenance and SHA; derivative editing may be allowed. Art direction is ChatGPT + user approval. Use the [image-specific handoff](IMAGE_HANDOFF.md) only for assets.
   - **Gameplay, UX, social/co-working, exhibition, networking, QA, platform, documentation:** inspect relevant code/contract and test affected player experience. No PNG/F1/F2/CORE03 requirement.
3. Produce only work explicitly authorized in the task. Commit fixes to the PR branch where safe, run scoped technical and visual tests, and attach preview/evidence with truthful limitations.
4. Record a durable `[HUDDLERSFIRE HANDOFF]` summary in the PR: exact commit/head, input and output sources, what ran, what passed or failed, changes affecting user experience, pending art/product/runtime/release decisions, and the next authorized action.
5. If unable to use the branch, renderer, source image or Sites feature, mark `blocked` with the specific missing capability and a non-fabricated alternative. Do not create a fake source, silently switch models, or mark an unperformed step complete.

## Explicit approval and privacy boundaries

- User's approval of a plan is **not** approval of generated artwork, PR merge or production publication.
- Never merge/close PRs or publish to production without explicit current authorization. Existing v2.0 PR #21 having been merged is not standing approval for future merges.
- GitHub original artwork is immutable; preserve exact source bytes. Work/Codex may author derived pixels/layers within scoped authorization; user owns final art judgment.
- No new site/DB/Cloudflare deployment, destructive migration, new paid API/service, leaked secrets or edits to global user harness.
- Existing GPT Sites project `appgprj_6ae8e9ae42708191b253341387aa287f`, binding `DB`, Discord/OAuth and public URL remain protected. GitHub CI is validation only. A Sites review version is not live publication.

## Acceptance of this handoff system

A successful **transport** test requires: (a) real scoped Chat-authored GitHub PR at exact head, (b) observable matching Work run or Work PR result, and (c) durable next-step evidence. A PR and passing CI **alone** establish only GitHub intake, not Work execution.

A successful **domain** test also requires the specific product/technical acceptance criteria of its task. Verify separately with art and non-art examples. If an event does not fire, report partial progress and the blocker, do not pretend or create duplicate schedulers.
