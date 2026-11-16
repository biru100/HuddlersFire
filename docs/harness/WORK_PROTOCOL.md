# HuddlersFire · work routing, approval and context protocol

## 1. On any request, not just art

1. **Restore context** from [README](README.md), [intent tree](INTENT_TREE.md), [current handoff](CURRENT.md), exact user message and relevant domain documents. Identify what is user-approved, observed and merely suggested.
2. **Classify intent**: L1 user experience, L2 desired effect/cross-cutting quality, L3 initiative and L4 scoped work item. If the requested task is purely maintenance, link it to affected product reliability/operability. Never invent user approval.
3. **Choose domain** (art, gameplay, community, exhibitions, UI/UX, network, platform, QA, release) and only then load applicable leaf skill and tests.
4. **Plan a smallest evaluable result** with constraints, affected modules, evidence, explicit user approval gates, rollback and completion signal.
5. **Execute within permissions**; branch/PR if requested/authorized. Technical checks do not approve product appeal or user-visible changes.
6. **Verify** actual affected experience plus appropriate tests, artifacts, and state after the change. Report exact source/CI/Sites IDs or mark unverified.
7. **Handoff** with known state, next authorized step, blockers, user decisions needed and links. Update [CURRENT](CURRENT.md) only for meaningful changes. Never claim hidden/asynchronous continued work without a real active task.

## Chat-authored direct dispatch

With a user-authorized task, ChatGPT may register the scope and acceptance evidence directly in the repository using one GitHub PR rather than asking the user to paste the same instruction into Work. The **existing PR opened/synchronize Work automation** may then continue, if the actual provider event fires. Follow [the canonical handoff](../automation/CHAT_PR_HANDOFF.md). PR creation is not evidence of a Work run. New artifacts, user approval and GitHub merge are distinct states. Reuse the Work event, do not create a duplicate scheduler or broaden the active user's requested scope.

## 2. Task record template

Use the [shared task template](tasks/README.md) for the task file and summarize the same scope in its PR.

- Never equate a proposed status with an approved feature. Do not mark pending gates approved because the same user approved another phase.
- Task state and evidence must point to the **same exact head**. Stale reports never silently upgrade current code.
- [WORK_QUEUE.json](../automation/WORK_QUEUE.json) records Work event tasks. Confirm its recorded heads and statuses against live GitHub before using them. Use the existing automation and its saved scope.

## 3. Approval varies by risk, not by the latest project theme

| Work class | AI may do without new aesthetic approval | Requires explicit user approval |
|---|---|---|
| Research / audit / scoped tests | read and report, non-destructive QA | changes to user intent/priority |
| Gameplay / UX | approved implementation, review screenshots, scope tests | new behavior or product trade-off outside approved scope |
| Art / animation | create proposals, make derivative pixel edits within approved task scope, preview, verify | final art/motion selection, runtime adoption if not already authorized |
| Network / data | diagnostics, compatibility tests, non-destructive fixes within approved scope | risky migrations, destructive behavior, broad compatibility change |
| GitHub / Work / release | verify current head, source, CI, build review version where authorized | prod Sites publication, destructive DB work, new paid services or external hosts |

The existing [automation policy](../automation/POLICY.json), [handoff](../automation/AGENT_HANDOFF.md) and [Sites instructions](../sites-deployment.md) remain authoritative for automation and deployment restrictions.

## 4. Context handoff required after meaningful work

Write a short handoff in the issue/PR and update [CURRENT](CURRENT.md) when the active initiative, meaningful decision, blocker, validated build, or next action changes:

```text
[HUDDLERSFIRE HANDOFF]
Goal + intent path:
Task / branch / PR / exact commit:
Approved vs proposed decisions:
Actual outcome and evidence:
Verification run and limits:
What is blocked / must not be done:
Next authorized action and approval owner:
Last verified (KST):
```

An AI joining from another ChatGPT chat, Work, Codex or Claude must restore this record from GitHub and **must not rely on remembered chat state alone**. If the current message conflicts with a dated document, use the most recent applicable explicit user decision and update the decision ledger with the actual evidence. Do not erase older superseded history.

## 5. Safeguards against harness overfitting

- Any leaf skill may be removed or replaced without affecting L0/L1 project intent.
- Any task-specific invariant (e.g. exact CORE03 mask, 16-frame requirement, 64×96 pilot) stays with its task unless explicitly generalized and justified.
- Inspect quality from the perspective of the affected player experience, not just bytes, asset counts or green CI.
- Do not require pixel-art approval gates for network and UI patches, or network stress tests for a purely text-only change.
- Stop repeating an ineffective technique. Re-scope the approach when evidence shows the same blocker, rather than manufacturing apparent progress.
- Hold one stable shared product intent and many independent, replaceable implementation approaches.
