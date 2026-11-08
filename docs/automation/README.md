# HuddlersFire: Chat → GitHub → Work → verified deployment

2026-11-08 사용자 요청: 사이트 배포까지 자동화한다. 이 결정은 이전의 실행/배포 직전 중단 요청을 운영 자동화 범위에서 갱신하지만 미승인 모션을 승인하지 않는다. 기존 사이트/DB의 삭제·이전·신규 유료 서비스 구매를 허용하지 않는다.

## 기존 ChatGPT 이미지 생성 전용 인계

추가 유료 이미지 API는 사용하지 않는다. 실제 원본을 GitHub에 한 번 전달하면 무손실 PNG 수신 검사와 보고서는 Actions가 진행한다. 인계 경로, 수신 JSON, PR/Work 이벤트 설정 방법은 [IMAGE_HANDOFF.md](IMAGE_HANDOFF.md)를 따른다. Work 이벤트 작업은 Work 화면에서 별도 권한 확인이 필요하며 이 PR에서 자동으로 활성화됐다고 주장하지 않는다.

## 실제 자동화와 남는 경계

Chat과 Work는 GitHub의 같은 commit, 원본 SHA256, 문서와 검사 상태를 읽는다. 두 대화의 로컬 파일이나 전체 대화가 실시간 동기화된다고 가정하지 않는다. 이 PR은 ChatGPT 프로젝트/Work 채팅을 자동 생성하지 않는다. 이미지 생성 결과도 GitHub 업로드 전에는 다른 세션에 있다고 간주하지 않는다.

1. Chat에서 원화를 생성하고 실제 PNG를 source-registry의 새 경로에 무손실 등록한다. 직접 업로드가 가능한 경우 같은 세션에서 원격 바이트 검증까지 한다. 불가능하면 원본 업로드 단계가 차단 상태다. ZIP과 미리보기로 바꿔치기하지 않는다.
2. main/art/**/automation/** push와 main 대상 PR에서 Actions가 원본/manifest SHA·크기·PNG 헤더, 신규 runtime 미술 승인, 기존 전체 테스트·pipeline·typecheck·lint·빌드·패키징 dry-run을 검사한다. 원본 등록 검사는 기존 motion/loop/미술 검토를 대체하지 않는다.
3. 자동 작업은 현재 PR과 Work 큐를 읽어 검사 결과를 반영한다. 실제 변경된 head를 검토하고 해당 head의 CI가 통과한 경우에만 범위가 허가된 PR을 SHA 조건부 병합한다. 코드와 테스트를 읽지 않고 초록 체크만 보고 병합하지 않는다. 미술 사용자 선택·새 비용·DB 이전 등은 자동 승인하지 않는다.
4. 검증된 변경이 main에 들어오면 production 설정을 검사하고 Workers에 자동 배포한다. PR/art 브랜치에는 배포 Secret을 주지 않는다. main보다 오래된 queued commit은 배포하지 않는다.
5. 공개 HTML과 /api/camp/version HTTP/JSON을 확인한다. 실패/설정 부족/사용자 미술 판단/배포 성공이 새로 생겼을 때만 사용자에게 알린다. HTTP 성공은 로그인·멀티플레이 실기기 검증을 뜻하지 않는다.

## 한 번 필요한 production 연결

GitHub Settings → Environments → production 또는 repository variables/secrets에 기존 배포 문서의 값을 등록한다. 이 작업의 도구는 Secret 값을 조회하거나 대신 생성하지 않았다. 토큰을 채팅이나 Git에 붙여 넣지 않는다.

- Secret: CLOUDFLARE_API_TOKEN.
- Variables: CLOUDFLARE_ACCOUNT_ID, CAMP_WORKER_NAME, CAMP_D1_DATABASE_ID, CAMP_PUBLIC_URL.
- 추가 안전 확인: CAMP_PRODUCTION_READY=true. 대상 Worker/D1 소유·데이터 유지 방침·migration 이력, Worker의 Discord secrets와 callback을 확인한 뒤 설정한다. 이 값은 설정 점검 완료 표식이며 실제 게임 QA의 증거가 아니다.
- 긴급 정지: CAMP_AUTO_DEPLOY=false. 배포 job은 차단되며 새 사이트 변경을 하지 않는다.

자동 push 배포에서는 DB migrations를 절대 실행하지 않는다. 새 DB의 최초 초기화 또는 검토된 pending migration은 main에서 기존 workflow_dispatch apply_migrations=true를 명시한 경우에만 허용한다. 기존 사이트와 DB를 삭제/교체하거나 비용을 추가하지 않는다. 설정 누락이면 config 단계가 명확히 실패하며 항목 이름만 기록한다.

## 원본과 런타임 승인

현재 공개 runtime 미술의 기준은 POLICY.json의 고정 commit이다. 그 이후 web/public의 이미지가 추가·변경·삭제되면 RUNTIME_ART_APPROVALS.json의 정확한 바이트 SHA와 실제 사용자 runtime 선택 문서가 필요하다. source-registry의 pending 시안은 CI에서 무결성을 검사할 수 있지만 웹 공개 자산으로 승격하지 않는다. 삭제는 별도 검토 대상으로 차단한다. 정책 자체가 승인 문구나 인간 신원을 인증하는 보안 경계는 아니므로 PR 검토도 유지한다.

## 상태 전달

- WORK_QUEUE.json: 다음 작업과 실제 차단 이유. 자동 작업은 최신 GitHub 상태를 읽고 중복 작업을 피한다.
- Actions summary와 huddlers-handoff-<run> artifact: 원본·검사 상태 JSON. 이것은 사용자 PNG 전달용 ZIP을 재도입하는 것이 아니다.
- production-readiness artifact: 값/비밀 없이 누락 이름·유효성·준비 상태만 기록한다.
- 기존 PR #7: f2 캔버스 불일치로 유효한 f2/f3/f4·실제 루프가 아직 없다. 이 자동화 요청을 애니메이션 완료로 보고하지 않는다.

## 테스트

node --test tools/tests/autoflow.test.mjs
node tools/autoflow.mjs inspect outputs/autoflow-status.json

이번 구현의 로컬 Node 테스트 8개와 YAML 구조 검사를 실행했다. 저장소 전체 검증 및 실제 production 결과는 새 head의 Actions 실행에서 확인한다. 이전 PR의 테스트 수치를 이번 검사로 쓰지 않는다.
