# HuddlersFire scoped work handoff template

Every task is a replaceable **L4 leaf**, never the project-wide harness. The canonical user intent is `docs/project-intent.md`; the current dated state is `docs/harness/CURRENT.md`. Prefer one file per authorized work package, linked from a GitHub PR.

## Minimal contract

```yaml
task_id: HF-TASK-...
title: ...
domain: art | gameplay | ux | social | exhibition | network | platform | qa | docs
status: authorized # proposed | authorized | in_progress | blocked | review | completed | superseded
intent:
  root: HF-ROOT
  experiences: [HF-REST]
  outcomes: [HF-REST.PRESENCE, HF-Q-VISUAL]
  initiative: HF-I-PRESENCE-ART
user_confirmed: []
not_authorized: []
inputs:
  exact_main_sha: null
  approved_source_sha256: []
  prior_prs: []
work_scope:
  first_deliverable: ...
  included: []
  excluded: []
acceptance:
  player_visible: []
  technical: []
approvals:
  aesthetics: pending # pending / not_applicable / approved_by_user
  runtime_adoption: pending
  production_publish: pending
evidence:
  actual_pr: null
  exact_tested_head: null
  ci_run: null
  preview_links: []
next_permitted_action: ...
```

The PR body must provide the same meaningful intent, boundaries and next action in prose. This is a template, not a new automated task database. Avoid duplicate queue controllers. If the requested work does not include art, do not add empty art-specific source requirements as blockers.
