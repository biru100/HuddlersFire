# NW Idle core plan 03: pre-execution verification

## Scope and actual status

The user asked this ChatGPT conversation to perform the required preparation without moving the work back to Codex, and to stop before application execution or deployment. Work stays in PR #7, `art/rounded02-idle-review-20261108`. No main merge, application server startup, game artwork replacement or public deployment was performed.

**Harness/plan preparation is complete. Animation asset production is not yet complete.** The actual registered plan03 job contains the approved f1 only. f2/f3/f4 are not fabricated or filled from historical sheets. Motion/user/native/runtime approvals remain pending.

## Implemented change

- New jobs opt into `composition.guardSource: anchor`. The eroded CORE selects generated RGBA. The inner four-pixel guard and every outside pixel select original f1 RGBA.
- Historical plans without that property retain their original full-mask/source-guard checks and prompt bytes.
- The allowed envelope is narrowed to central hood/upper-back cloth interior; outer sleeves, hands, cuffs, hem, head/hair/face, legs and shoes remain outside.
- Raw source guard/outside differences are preserved and disclosed separately from derivative protected-pixel measurements. A clean derivative does not certify full-source success.
- The CORE/guard seam gradient, region-change budgets, no-motion blocks, original canvas, color-profile and loop checks still apply. No blending, feathering, resize, realignment, alpha conversion, quantization or code redrawing was introduced.
- The scoped ChatGPT review accepted this plan for a real f2 pilot only. `confirm-plan` records that limited review and does not invent user motion selection.

## Current committed preparation

Commit: `7ba9324acb0a19fba64a6eba02a81f9360c220a5`.
Folder: `art/sprites/source-registry/rounded02-idle-frames-nw-03/`.
Anchor SHA256: `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`.
CORE mask SHA256: `278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d`.
Plan SHA256: `c4d73e258b017803122ebb4bd40f40392fa99f07a27a6ca3ab69f65c4dd85556`.
Frame intent SHA256: `7cfcfe2908ce651ef31a87cfe9f716dc7073a541764f7c63007f916d5daeb5d1`.

The prepared source artifact was downloaded from GitHub Actions and its archive SHA256 verified (`944057da65a71a1db7b3b9aff5b969fb261c1e63049cae7ee43caf2ff8543222`). Local SHA256 and Git blob hashes of the restored anchor, frozen mask, plan, timing, confirmation and f2 request were recalculated. Their Git object hashes match the remote commit metadata. This verifies actual preparation bytes, not new motion artwork.

## Fresh automated validation

[Dedicated verification run](https://github.com/biru100/HuddlersFire/actions/runs/42453305633), job `128646912664`, ran against the migrated code before committing it as `7ba9324`. All steps succeeded.

| Check | Actual result |
| --- | --- |
| Full suite | 353/353 PASS, failures 0, skips 0 |
| Sprite pipeline | 128/128 PASS, failures 0, skips 0 |
| Idle frame suite | 32/32 PASS, failures 0, skips 0 |
| Typecheck | PASS |
| Lint | 0 errors, 4 pre-existing runtime warnings |
| Isolated build | PASS, no server started |
| Plan03 preparation and registry verification | PASS; f2/f3/f4 absent, assemblyReady false |
| Protected policy/renderer/public asset diff | No changes |

Suites overlap and must not be added together. Eight new tests cover old-plan compatibility, core-only selection, disclosed discarded changes, protected guard pixels, seam rejection, change budgets, unknown-policy rejection, request scope and the actual approved f1 with a deliberately synthetic one-pixel delta. Synthetic pixel tests are not character or animation artwork.

The local partial snapshot ran the new 8/8 successfully. A broader local subset had 88/90 passing with two missing-document failures because that snapshot excluded those repository documents. The complete GitHub runner subsequently passed all 353 tests; local missing-document failures were not presented as code failures or silently marked passed.

## Temporary tooling cleanup

Read-only source snapshots and an exact-input, branch-scoped preparation workflow were used because the chat container could not resolve GitHub directly. Temporary workflows and the one-time migration script are removed after the verified commit. They did not request production secrets or invoke deployment. The normal PR verification workflow remains; its deployment job is limited to explicit manual main workflow dispatch.

An incomplete text-transfer artifact was briefly created, immediately deleted and never applied. The actual changes were applied through the readable exact-input migration and verified by fresh tests.

## Remaining gates

1. Genuine f2 single-frame source from the approved f1 and the reviewed plan03 request.
2. Actual PNG/canvas/hash/core-budget/seam inspection; preserve any failure without resizing or silently repairing it.
3. Only if the pilot is suitable, independently generate f3 and f4 from the same f1, then inspect and compose.
4. Actual four-frame loop/art review and user's motion selection.
5. Separate native 64x96 delivery, runtime integration approval and deployment authorization.

No artwork quality, native delivery, runtime readiness or deployment success is claimed by this report.
