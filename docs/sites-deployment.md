# 기존 GPT Sites 재연결 · 버전 저장 · 게시

## 최신 결정 및 안전 경계 (2026-11-08)
사용자는 **기존 GPT Sites 사이트를 그대로 재사용**하기로 결정했다. 2026-11-07의 GitHub Actions → 외부 Cloudflare Worker 직접 배포는 대체됐다. **새 Site·D1·URL을 만들지 않는다.** 과거 공개된 URL과 DB·로그인·공유 설정·운영 기록을 삭제/초기화/이전하지 않는다. 기존 GitHub 소스/PR/원본 PNG, Work PR 이벤트 자동화는 유지한다.

- 기존 Site project_id (GitHub 이전 기록의 복구값): `appgprj_6ae8e9ae42708191b253341387aa287f`
- 기존 D1 바인딩: `DB`; R2: 없음(`null`).
- 이전에 문서화된 공개 URL: `https://huddlers-fire-camp.gywkd77.chatgpt.site`. **현재 공개 버전·실제 URL/접근권한/DB 상태는 Sites에서 확인해야 하며, URL 기록만으로 현재 운영 성공을 주장하지 않는다.**
- 파일: `web/.openai/hosting.json`. 이것은 사이트 연결 메타데이터이며 인증 토큰/비밀값 저장소가 아니다.
- 복구 경로: 기존 GitHub commit `9b893b664e46b5bb8b19e7500816c8672ae094d2`의 Sites Vite 빌드/플러그인/프로젝트 연결. 2026-11-07 외부 배포 전환에서 제거된 연결만 되돌린다.

## 역할과 동기화의 실제 범위
1. Chat은 기존 ChatGPT 이미지 생성으로 원화를 만든다. 실제 PNG가 GitHub에 원본 바이트로 들어와야 Work와 CI가 수신한 것이다. 유료 API 없음.
2. GitHub Actions `Verify for existing ChatGPT Sites`는 PR/main의 무결성·테스트·빌드 및 `dist/.openai/hosting.json`/마이그레이션 패키징을 검사한다. **GitHub에서 사이트를 직접 게시하지 않는다.** 이전 Cloudflare production Secrets/Variables는 더 이상 필요하지 않다.
3. Work는 현재 GitHub head 및 해당 검증을 확인한 뒤 **기존 Sites 프로젝트**를 열고 소스와 사이트 버전의 차이를 검토한다.
4. Sites에서 **버전 저장(Save version)** 을 먼저 한다. 버전 저장은 운영 게시와 다르다. 새 버전, 이전 운영 버전, 스크린샷/기능, 연결된 운영 저장 데이터의 영향 및 필수 비밀키 이름을 확인한다.
5. 배포 대상이 정확히 동일한 프로젝트이고 기존 DB·Discord OAuth·공개 범위·런타임 자산 승인이 유지되며 배포 권한이 있는 경우에만 **해당 기존 Site에 배포(Deploy version)** 한다. 미확인/변경된 DB schema, 사용자 미술 판단 필요, 위험한 migration이 있으면 보류하고 사용자 판단을 요청한다.
6. 결과는 실제 Sites가 반환한 **저장 버전 ID, 배포 성공, 공개 URL과 API/로그인/방·RTC 확인**으로 보고한다. GitHub CI PASS 또는 파일 추가만으로 배포 완료라 하지 않는다.

## Work 실행 인계 (현재 Chat에서 Sites 조작 불가능한 경우)
Work에서 기존 HuddlersFire 사이트를 열고 다음 작업을 수행한다.

> GitHub `biru100/HuddlersFire`의 최신 검증된 main과 `docs/sites-deployment.md`를 읽어줘. `web/.openai/hosting.json`의 **기존 project_id**와 일치하는 GPT Sites를 재사용해. 절대 새 사이트·DB를 만들지 말고 기존 사이트/데이터/공개권한/OAuth를 보존해. 버전 저장 전 전체 앱과 migration 영향을 검사하고 기존 사이트에 새 버전을 **저장만** 한 뒤 현재 배포 버전과 차이·URL·검증 결과를 보고해줘. 사용자의 별도 사이트 게시 승인이 필요하거나 위험하면 게시하지 말아줘. GitHub Actions 배포는 사용하지 마.

이 인계는 Work/Sites의 실 작업이 완료되기 전까지 **소스 복구/검증 단계**다. 자동화 작업의 이벤트 트리거가 새 버전 게시까지 보장하지 않는다.

## 호환성·데이터베이스
- 2026-11-09 사용자 승인에 따라 새 릴리스 활성화는 기존 방·참가자·시그널을 삭제하지 않고 `camp_runtime` fence만 전진시킨다. 자동 새로고침·구버전 차단과 정상 TTL/퇴장 정리는 유지한다. v41 저장과 운영 migration 이력 확인의 남은 경계는 [검증 기록](validation.md)을 따른다.
- `web/vite.config.ts`는 기존 `hosting.json`의 `d1`/`r2`를 다시 읽고 Vite의 Sites 플러그인을 빌드에 포함한다.
- `web/scripts/vite/sites-vite-plugin.ts`는 빌드 시 `dist/.openai/hosting.json`과 `dist/.openai/drizzle`을 복사한다.
- `tools/check-sites-package.mjs`는 복구된 ID/DB 바인딩 및 빌드의 SQL 파일 해시가 소스와 일치하는지 **읽기 전용** 검사한다.
- Sites 배포는 새 앱 버전 게시 이전에 DB에 영향을 줄 수 있고, 과거 버전으로 코드만 복원해도 DB는 복원되지 않는다. 실제 데이터/마이그레이션 이력을 확인하지 않고 SQL 실행·초기화·새 DB 연결을 하지 않는다.
- Discord `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` 및 TURN 관련 Secret은 기존 Site의 **Settings**에서만 확인한다. 로컬 `.dev.vars`가 운영 값으로 자동 복제되지는 않는다.
- 기존 공개 URL 또는 공유 대상은 Sites UI에서 확인한다. URL이 변경됐으면 Discord Callback도 **확인 후** 변경한다.

## 기록/문서 상태
- GitHub Issue #9의 외부 Cloudflare 운영 설정 필요 항목은 현재 경로에선 **대체된 과거 이슈**다. 새 Cloudflare 토큰 발급을 요구하지 않는다.
- `docs/github-deployment.md`는 과거 직접 배포 안내였으며 현재는 Sites 인계 안내로 연결한다.
- 원본 PNG/모션 승인 `pending`은 그대로 유지한다. 새 Sites 연결이 미승인 픽셀 원화의 공개를 허용하지 않는다.

공식 참고: [Sites 관리](https://learn.chatgpt.com/docs/sites/managing-a-site), [Sites 버전/게시](https://learn.chatgpt.com/docs/sites/publishing-and-sharing), [사이트 생성과 사용](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites).
