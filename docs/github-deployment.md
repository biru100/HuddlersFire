# GitHub 사이트 배포와 Chat/Work 자동화

2026-11-08 사용자 요청으로 검사부터 사이트 배포까지 자동화한다. 최신 운영 기준은 [자동화 계약](automation/README.md)과 [정책](automation/POLICY.json)이다. 2026-11-07의 수동 배포 전용 규칙은 이 범위에서 대체한다. GPT/Sites 게시를 다시 사용하거나 기존 사이트·DB를 임의로 삭제하지 않는다.

## 현재 구조

- Chat/Work는 GitHub 원본 PNG·SHA256·리뷰·작업 큐·Actions를 공통 기준으로 사용한다. 대화/로컬 파일이 자동 공유된다고 가정하지 않는다.
- main/art/**/automation/** push와 main 대상 PR은 검사한다. 실제 runtime 이미지 교체에는 LOOKDEV와 별개의 사용자 승인 근거가 필요하다.
- main의 전체 검사·빌드·production 설정 점검 후 Cloudflare Workers로 자동 배포한다. PR/art 브랜치는 운영 토큰을 사용하지 않는다.
- production 배포는 직렬 처리하고, 배포 직전 최신 main과 다른 오래된 커밋은 건너뛴다.
- 성공 후 공개 HTML과 `/api/camp/version` HTTP·JSON을 확인한다. 실제 Discord 로그인/두 클라이언트 RTC·호스트 승계 검증을 이 결과로 대신하지 않는다.

## 최초 운영 연결

GitHub Settings → Environments → production 또는 repository Variables/Secrets에서 다음을 설정한다. 값은 채팅/Git에 올리지 않는다.

| 종류 | 이름 | 용도 |
| --- | --- | --- |
| Secret | CLOUDFLARE_API_TOKEN | 실제 대상 Worker 배포 권한. 별도 migration 실행 시 D1 권한 필요 |
| Variable | CLOUDFLARE_ACCOUNT_ID | 소유 Cloudflare 계정 ID |
| Variable | CAMP_WORKER_NAME | 실제 배포 대상 Worker 이름 |
| Variable | CAMP_D1_DATABASE_ID | 실제 D1 UUID, 로컬/CI placeholder 금지 |
| Variable | CAMP_PUBLIC_URL | 소유·확인된 Worker HTTPS origin |
| Variable | CAMP_PRODUCTION_READY | 초기 설정·데이터 방침·migration 이력·Discord callback 확인 후 true |
| Variable, 선택 | CAMP_AUTO_DEPLOY | false이면 배포 차단. 검사는 계속 가능 |

2026-11-07 문서에는 운영 설정이 비어 있다고 기록돼 있었다. 이번 변경은 실제 값이 채워졌다고 주장하지 않는다. 최신 상태는 main Actions의 production preflight에서 누락 **이름만** 보고한다. Secret 값은 조회·출력·로그·artifact에 넣지 않는다. 환경 승인 규칙이 켜져 있다면 GitHub의 기존 승인 대기를 우회하지 않는다.

Worker 런타임의 `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`과 새 origin의 `/api/camp/discord/callback`을 설정한다. TURN 사용 시 기존 `TURN_URLS`, `TURN_SHARED_SECRET`도 확인한다. 이 값들이 이전 Sites 환경에서 자동 이전된다고 가정하지 않는다. Worker secrets는 클라이언트 번들에 넣지 않는다. 기존 deploy script의 `--keep-vars`는 유지한다.

## 데이터베이스 안전 경계

새 Worker·D1 생성, 기존 Sites 데이터 이전/삭제, 유료 서비스 구매는 자동으로 하지 않는다. 기존 DB에 SQL이 적용됐다고 해서 `d1_migrations` 이력이 있다고 가정하지 않는다.

자동 main push에서는 migration을 실행하지 않는다. 새 빈 DB의 초기화나 검토한 pending migration은 대상과 적용 이력을 확인한 뒤 main의 수동 **Run workflow → apply_migrations=true**로만 실행한다. 기본은 false다. CAMP_PRODUCTION_READY는 이 설정/방침을 검토했다는 표식이지 실제 게임 QA 완료가 아니다.

## 실패와 복구

검사 실패, 원본/승인 불일치, 미설정 production 값은 차단 상태로 보고한다. 준비 문서·CI 성공을 실제 사이트 배포라고 말하지 않는다. 초기 설정을 채운 뒤 실패한 production job을 재실행하거나 main에서 workflow_dispatch를 실행하면 동일한 검사를 다시 통과해야 배포된다. 자동 작업은 transient 실패만 제한적으로 재시도하며 자격증명 누락을 무한 재시도하지 않는다.

긴급 중단은 CAMP_AUTO_DEPLOY=false다. 배포 롤백은 이전 검증 소스를 새 릴리스로 다시 빌드하는 방식으로 검토하며 방의 release fence나 DB를 무조건 되돌리지 않는다.

## 로컬/CI 검사

`node --test tools/tests/autoflow.test.mjs`, `node tools/autoflow.mjs inspect outputs/autoflow-status.json` 및 web의 전체 테스트·pipeline·typecheck·lint·build·deploy:check가 실행된다. deploy:check는 업로드하지 않는다. 실제 deploy는 검증된 main과 production 설정이 모두 갖춰진 경우에만 실행한다.

기존 공개 Sites 주소와 데이터는 이 변경으로 폐기되지 않았다. 새 실제 Worker URL과 원격 확인 결과가 있어야 새 호스트 배포 완료로 기록한다.
