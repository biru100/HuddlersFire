# HuddlersFire Work GitHub PR 이벤트 인계

## 2026-11-16 direct Chat-authored GitHub handoff v2

**Canonical Chat→GitHub PR→existing Work operating contract:** [CHAT_PR_HANDOFF.md](CHAT_PR_HANDOFF.md) and [task template](../harness/tasks/README.md). User asked to remove repeated manual Work prompt copying. Chat writes a bounded, intention-linked work order + evidence to one GitHub PR; the same existing PR opened/synchronize Work automation receives it when the provider event actually fires. A PR is **transport intent, not proof of Work execution**; confirm real Work results before reporting success. Do not create another trigger, schedule or polling loop.

For any scoped PR, read actual user intent and the `[HUDDLERSFIRE HANDOFF V2]` task contract, then select a domain. No source PNG required for non-art tasks. For art, source image hashes and independent user art approvals remain required. Record exact head tests, screenshots/preview when possible, blocked approvals and the next permitted step on the PR. Do not auto-merge or auto-publish.

## 2026-11-16 project-wide intent router (supersedes art-only interpretation)

**First read** [project intent](../project-intent.md), [project harness](../harness/README.md), [intent tree](../harness/INTENT_TREE.md), [dated handoff](../harness/CURRENT.md) and [work protocol](../harness/WORK_PROTOCOL.md). The user's project-wide purpose is the quality of HuddlersFire, not generating NW Idle frames. Determine the request's experience intent and **domain** before invoking any specialized processing.

- **Art PR:** preserve original bytes and provenance, user-selected design; ChatGPT concepts/key poses. As explicitly authorized 2026-11-16, Work/Codex may edit **derivative native pixel art, layers and motion** within the authorized art task. User final art approval and runtime/release gates are still separate. Only art intake requires PNG/manifest/SHA.
- **Non-art PR:** inspect actual diff, purpose, relevant app/system tests, CI, end-user effect and safe rollback. **Do not require missing PNG, F1/F2, a CORE mask or animation approval to process gameplay, UX, network, community, booth, reliability or docs PRs.**
- All PRs: preserve current main/PR/commit provenance; avoid duplicate Work jobs. A successful code check does not prove player experience or Sites publication. Maintain the single existing GitHub-PR Work trigger.
- After meaningful task/decision updates, write cross-context evidence + next permitted step to the PR/issue and [CURRENT](../harness/CURRENT.md) when in scope. Do not claim automatic continuity from Chat history.

The image-specific instructions below remain valid **only for image asset handoff** where not superseded by the latest user choice. No new Site/DB/Cloudflare direct release, paid image API, destructive migration or automatic art approval is authorized.

## Chat 이미지 수신

[이미지 인계](IMAGE_HANDOFF.md)는 Chat 원본의 업로드·검사·출처 기록을 정의한다. 원격 바이트·SHA256과 작업 계약을 확인한 뒤 허가된 파생 제작·검토를 진행한다. CORE03의 F1/마스크 제약은 그 작업에만 적용한다. 참조 자료와 제작 자산의 채택 상태는 구분한다.

## 트리거 및 작업 큐
- 사용자가 설정한 Work 이벤트 작업은 `biru100/HuddlersFire`의 GitHub PR opened/synchronize를 사용한다. 저장된 트리거와 범위를 유지하고 매시간 점검을 재활성화하지 않는다. 열린 PR의 최신 head를 확인한다. PR·head·원본 SHA256·작업 단계로 중복을 확인한다.
- 매 실행에서 최신 main, PR diff, 현재 head CI, [정책](POLICY.json), [큐](WORK_QUEUE.json), [이미지 수신](IMAGE_HANDOFF.md)을 확인한다. 과거 head의 초록 체크나 Chat의 미전달 PNG를 실제 최신 원본으로 취급하지 않는다.
- PR/source SHA·단계별 중복을 확인한다. 새 PR 생성만으로 사이트 배포를 시작하지 않는다. 동시에 동일 범위의 PR이나 Work 실행이 있으면 기존 것을 이어받는다. 무의미한 이벤트 루프를 만들지 않는다.

## 기술 안전 조건
- 변경 파일과 코드 diff를 읽고 요구 테스트·CI를 실제 head에서 확인한다. 해당 PR의 병합 또는 종료에는 각각 사용자의 명시적인 현재 승인이 필요하다. 구현 승인과 CI 통과는 병합 승인을 대신하지 않는다.
- 원본 PNG 바이트를 보존한다. 새로운 PNG는 실제 원격 바이트·SHA256·manifest, 기존 job과 현재 검사 결과로만 처리한다. 파일명/설명만으로 업로드 성공을 주장하지 않는다.
- `blocked`, `awaiting_plan_confirmation`, `ready_for_explicit_intake`를 구별한다. 마지막 상태에서도 기존 intake/compose/inspect/assemble 및 실제 미술 검토가 필요하다.
- 미술·모션의 최종 선택은 사용자 권한이다. 파생 제작은 개별 작업의 허가와 계약을 따르며, 원본의 강제 변환과 유료 이미지 API를 금지한다. 런타임 채택과 게시는 각 승인에 따른다.

## 기존 사이트에 연결
- 빌드의 `web/.openai/hosting.json` project_id가 **기존 사이트** `appgprj_6ae8e9ae42708191b253341387aa287f`인지 확인한다. D1 binding은 `DB`, R2는 `null`이다.
- GitHub Actions는 **검증만** 하고 Sites 배포 작업을 수행하지 않는다. Cloudflare 계정 토큰·Worker 이름·직접 D1 ID 등을 요청하지 않는다.
- Work의 Sites 기능에서 정확한 기존 프로젝트를 연다. 실제 운영 데이터·현재 릴리스·공유 대상·OAuth·SQL migration 영향을 확인한 뒤 최신 검증된 main으로 **리뷰용 버전만 먼저 저장**한다. Sites 작업이 불가능한 작업 환경이면 명확히 알리고 사용자가 원래 Site를 열 수 있도록 인계한다.
- 기존 사이트·데이터/Discord/TURN secrets를 새 프로젝트에 복제하거나 삭제/초기화하지 않는다. 실제 Site 게시 전에 기존 데이터 안전·사용자 승인/원화 승인이 확인되어야 한다. Sites의 version 저장/게시 결과를 GitHub CI 성공으로 대체하지 않는다.
- 프로젝트 외부 DB 쓰기/migration/새 유료 API·서비스 생성 및 추가 비용 발생을 금지한다.

## 보고
- 신규 코드/검사 성공, 실제 원본 수신, 리뷰용 Sites 버전 저장, 기존 사이트 배포 성공, 새 사용자 결정이 필요한 차단만 보고한다.
- 실제 Site 링크/버전·검증된 GitHub head·PR/run ID를 근거로 제시한다. 운영 웹사이트의 URL·게시 여부를 추정하지 않는다.
- 이전 이슈 #9는 **Cloudflare 외부 배포 당시의 차단**이다. 같은 설정을 다시 요구하거나 중복 이슈로 만들지 않는다.
