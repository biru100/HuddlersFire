# HuddlersFire Work GitHub PR 이벤트 인계

## User-specified operational sequence (2026-11-09)

**Chat owns generation + uploading the actual image sources into GitHub. Work owns assembly/pixel processing/applying resource assets to the actual site. Work/Sites then saves a review version and publishes to the SAME existing project when approved.** This is the operating priority over the old single F2-focused development exercise.

- Inputs are actual GitHub PR binary images + manifest, possibly **one multi-frame 2x2 concept sheet** rather than a strict final F2. Use [generic batch contract](../../art/sprites/incoming/chat-asset-batches/README.md) for new concept sheets and mixed assets. Preserve originals; derive production sprites and game pixel resources separately. Do not apply the NW CORE03 frozen-frame restrictions to unrelated resource concepts.
- Existing PR opened/synchronize Work trigger is reused, no duplicate automation.
- Work must inspect SHA, source image PNG, purpose, proposed scene, current code, game rendering and CI. Prepare a visually inspectable site version first. Runtime changes need actual user-selected art and release authorization. Do not infer approval from a raw upload or concept sheet.
- **Binary handoff is not automatic merely because Chat generated a PNG:** current GitHub connector must actually accept the source bytes. If it cannot, report the exact block and request a one-time GitHub upload. Do not fake it with JSON.
- Retain the original Site \`appgprj_6ae8e9ae42708191b253341387aa287f\`, existing DB binding, URL, Discord connectivity and data. Save version → verify preview → publish authorized changes, never new Site/DB or unattended schema writes.

---
**2026-11-08 최신 사용자 결정:** 기존 GPT Sites 프로젝트를 그대로 사용한다. 이전 외부 Cloudflare 직접 배포 지시는 대체됐고, 기존 이미지 생성·GitHub/Work 워크플로우는 유지한다. [Sites 운영](../sites-deployment.md).

## 트리거 및 작업 큐
- 사용자가 설정한 Work 이벤트 작업은 `biru100/HuddlersFire`의 GitHub PR opened/synchronize를 사용한다. 기존 매시간 중복 작업은 일시중지한다.
- 매 실행에서 latest main, PR, exact head CI, [정책](POLICY.json), [큐](WORK_QUEUE.json), [이미지 수신](IMAGE_HANDOFF.md)을 확인한다. 과거 head의 초록 체크나 Chat의 미전달 PNG를 실제 최신 원본으로 취급하지 않는다.
- PR/source SHA·단계별 중복을 확인한다. 새 PR 생성만으로 사이트 배포를 시작하지 않는다. 동시에 동일 범위의 PR이나 Work 실행이 있으면 기존 것을 이어받는다. 무의미한 이벤트 루프를 만들지 않는다.

## 기술 안전 조건
- 변경 파일과 코드 diff를 읽고 요구 테스트·CI를 실제 head에서 확인한다. 승인된 작업에 한해서만 조건부 PR 병합을 진행할 수 있다. 다른 사람의 무관한 PR은 임의 병합하지 않는다.
- 승인 f1 원본을 수정하지 않는다. 새로운 PNG는 실제 원격 바이트·SHA256·manifest, 기존 job과 현재 검사 결과로만 처리한다. 파일명/설명만으로 업로드 성공을 주장하지 않는다.
- `blocked`, `awaiting_plan_confirmation`, `ready_for_explicit_intake`를 구별한다. 마지막 상태에서도 기존 intake/compose/inspect/assemble 및 실제 미술 검토가 필요하다.
- 미술/모션/실제 게임 runtime 승인·네이티브 64x96 변환, 유료 이미지 API, 원화 강제 크롭/축소/변환을 하지 않는다.

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
