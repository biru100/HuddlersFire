# Chat / Work / scheduled coordinator: execution contract

This is the active deployment automation policy for the user's 2026-11-08 request. It supersedes older manual-only deployment instructions for verified changes, but never supersedes explicit art, database, privacy or payment approvals.

## Read at the start of every iteration

1. Read the current PR/head and docs/automation/POLICY.json, WORK_QUEUE.json and README.md from GitHub. Use current branch data; do not rely on another chat's local paths.
2. Preserve the user-selected NW/SE design originals and pending Idle motion state. A failed f2 canvas is not accepted. Do not retry the same unconstrained whole-character prompt indefinitely or manufacture f3/f4.
3. For new raw PNGs, confirm actual remote bytes/SHA and run the existing art/motion tests. The lightweight autoflow inventory is not a replacement for decoding, region/loop inspection or artistic review.
4. Review the actual code diff and the CI for the exact head before merging an authorized PR. Never approve or merge unknown contributor code solely because a label or a green check exists. Use expected_head_sha and never force-push over concurrent work.
5. Only the existing HuddlersFire delivery scope is authorized. No new paid APIs, forced image transforms, runtime-art approval inventions, credential requests in chat, DB destructive actions or deletion of the old site.

## Automatic continuation

The delivery automation PR can be merged after current-head review and successful CI; main then runs the gated deployment workflow. PR #7 remains a separate motion-preparation effort. Infrastructure-only changes can be reviewed independently, but unfinished motion cannot be described as a finished product or installed as runtime artwork.

An hourly ChatGPT automation checks new source commits, PR/CI changes and production preflight. It may fix a specific in-scope automation/test defect on the existing branch, verify it, and merge the exact reviewed head. It reports only meaningful new completion, blockers requiring the user, or deployment results. A task run is not proof a separate Work chat/project was created.

After settings are filled, a failed production job may be retried through the existing GitHub action. Limit unchanged missing-setting retries to once per day; never repeat a successful deployment. An environment approval wait is surfaced, not bypassed. If no relevant state changed, do not notify.

## Sharing images

Image generation still occurs in an image-capable Chat. The actual generated PNG must land in GitHub before the scheduled coordinator or another Work session can inspect it. No tool here is assumed to watch Chat attachments continuously or start image generation from a GitHub event. This is an explicit remaining interface boundary, not a hidden automatic transfer.

## Current no-paid-API Chat image handoff

User chose the existing ChatGPT Chat image generation surface, **not** the paid image API. Follow [IMAGE_HANDOFF.md](IMAGE_HANDOFF.md) when receiving a real ChatGPT-generated PNG. When a PR includes art/sprites/incoming/<set-id>/<f2|f3|f4>/<attempt>/original.png, read request.json and GitHub Actions art-handoff-report.json. If the actual source is absent, do not infer it from conversation references. Treat blocked and awaiting_plan_confirmation as distinct. Once ready_for_explicit_intake, use the existing source-registry/idle-frames tool gates on that branch, not a new drawing/model call. Never auto-approve motion. A Work GitHub PR event trigger must be separately enabled in Work by the user; the hourly coordinator remains a fallback.
