# One-time approved release request for original HuddlersFire GPT Sites

**User authorization:** 2026-11-08, after the assistant explained saving a verified version and publishing it to the same existing project, the user said "어 그렇게 하자". This is authorization for this specific release only, not for all future PRs.

**Actual source commit to verify:** `5ba1566b6d5a9fdfa1de7e36f2f0b3ee7efe5fb6`

**Original Sites project ID:** `appgprj_6ae8e9ae42708191b253341387aa287f`

**Existing public site:** https://huddlers-fire-camp.gywkd77.chatgpt.site/

**Original database binding:** `DB`; `r2: null`.

**Current live release at last public check:** `6cd35d15-c98f-4b9b-b0e9-e0262bf01c98`. This is NOT proof the source commit has been deployed.

**GitHub CI for source commit:** [42480146866](https://github.com/biru100/HuddlersFire/actions/runs/42480146866), success; full project and Sites packaging checks passed.

**Read-only comparison:** GitHub published-v38 source sync `42591a0646553a76bbf19d8987620a478cd9a028` → current source shows no changes in `web/drizzle/`, `web/db/`, or `web/worker/` migration/schema paths. Other web renderer/preview files changed. Actual hosted DB and OAuth settings still require read-only verification.

## Work checklist for this one-time release

1. Confirm this PR belongs to the user's existing repository and that the **exact source SHA above** has passing current GitHub CI. Confirm this document is user-authorized, not approval inferred from an arbitrary outside PR.
2. Open **the existing GPT Sites project** and verify its project ID, current production release, public URL, `DB` binding, and relevant Discord OAuth/server secrets **without exposing or modifying secret values**.
3. Do not create another Site, change public URL/share settings, create/migrate/wipe DB, change Secrets, call paid image APIs, or promote pending graphics. If actual production DB compatibility cannot be proven or migration is needed, **STOP**.
4. Save the verified source as a **new version in this same Site**. Saving the version is not publishing it. Verify its build and representative gameplay/API. Check version identity and ensure no unintended assets.
5. If all checks pass, the user has approved **one publication of this exact source commit** to the same Site. Deploy and verify public HTML and `/api/camp/version` plus sign-in/room behavior where available. If login/RTC cannot be truly tested, report that limitation rather than saying full QA passed.
6. Record the actual saved version ID, published version ID, public URL and timestamps, or the exact blocker. Do not repeat after an actual successful publish.

**Important:** This document is a durable release request and Work trigger. It is **not proof of a saved version or deployment**. It must not authorize publishing later commits. GitHub Actions remains verification-only.
