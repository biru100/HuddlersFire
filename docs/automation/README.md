# HuddlersFire: Chat → GitHub → Work → 기존 GPT Sites

2026-11-08 최신 결정: **기존 GPT Sites 프로젝트를 재사용한다.** 새 외부 Cloudflare 계정/Worker/D1을 만들지 않는다. 이전 GitHub 직접 배포 설계를 수정한 것이다.

## 자동화된 것
- Chat의 실제 원본 PNG가 GitHub 수신 경로에 들어오면 파일 출처·무결성·캔버스·앵커·프레임 순서를 검사한다. 원본이 실재하지 않으면 자동 수신이라고 주장하지 않는다. [이미지 전달](IMAGE_HANDOFF.md).
- 현재 `main`을 대상으로 새 PR/커밋이 있으면 Work PR 이벤트 작업이 실제 latest head, CI, 원본 바이트, 승인 상태를 검토한다. 기존 매시간 중복 폴링은 비활성화 상태를 유지한다.
- GitHub Actions는 모든 검사 후 **기존 GPT Sites에 연결할 빌드**의 `hosting.json`, SQL 마이그레이션과 서버 파일까지 검증한다. 배포 Secret을 PR에 전달하지 않는다.
- `main` CI의 성공은 *정상 코드 패키지*를 의미한다. Sites version saved, production deployed, UI/Discord/WebRTC verified는 **각각 다른** 상태다.

## 인간/Work 판단이 필요한 것
- Chat 이미지 생성 완료와 GitHub 원본 업로드 사이의 파일 전달은 자동 공유되지 않는다.
- 미승인 Idle f2/f3/f4와 실제 모션 사용자 선택은 계속 pending이다. 미술·runtime 승인 자동화 금지.
- Work는 [기존 GPT Sites 배포 절차](../sites-deployment.md)에서 프로젝트 ID와 동일 Site/DB 상태를 확인하고 검증된 main으로 Sites 버전을 먼저 저장한다. 새 사이트·DB를 만들지 않는다.
- 저장된 버전을 실제 게시하기 전에 공개 사용자·마이그레이션·OAuth·게임 상태를 확인한다. CI success로 운영 DB를 자동 이전/수정하지 않는다. 이전 사이트/DB·승인 데이터는 보존한다.

## 기존 Cloudflare 직접 배포와의 차이
이제 GitHub production 환경에 CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CAMP_D1_DATABASE_ID, CAMP_WORKER_NAME, CAMP_PUBLIC_URL, CAMP_PRODUCTION_READY를 추가할 필요가 없다. 외부 직접 배포 Job도 제거했다. GitHub Issue #9는 역사적 차단 기록이며 새 사이트 설정 과제가 아니다.

## 상태와 검사
- Work 단계별 범위: [AGENT_HANDOFF.md](AGENT_HANDOFF.md).
- 정책과 실제 공개 대상: [POLICY.json](POLICY.json).
- 남은 큐: [WORK_QUEUE.json](WORK_QUEUE.json).
- 수신 검사: `node tools/art-handoff.mjs inspect`.
- 테스트: `node --test tools/tests/autoflow.test.mjs tools/tests/art-handoff.test.mjs tools/tests/sites-package.test.mjs`.
- Sites 패키지 검사: `node tools/check-sites-package.mjs` (빌드 뒤).
- 실제 Sites 호스팅 상태는 Sites에서 확인할 수 있을 때만 완료로 기록한다.
