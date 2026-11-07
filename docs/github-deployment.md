# GitHub에서 사이트 배포

2026-11-07 사용자 요청으로 **GPT/Sites 게시를 중단하고 GitHub Actions로 배포를 관리**한다. GitHub가 소스·검사·배포 실행 기록을 소유하고, 서버 실행은 기존 앱 형식에 맞춰 Cloudflare Workers + D1을 사용한다. GitHub Pages의 정적 파일만으로는 세션·Discord OAuth·방·시그널링 API를 실행할 수 없다.

## 현재 상태

- `.github/workflows/deploy.yml`: PR/main push 검사, main에서 수동 운영 배포.
- `.openai/hosting.json`과 Sites 배포 패키징 훅을 제거했다. 기존 Sites 공개 사이트·DB·과거 검증 기록은 보존한다.
- GitHub 저장소의 Secret/Variable 이름 목록은 현재 비어 있다. 따라서 아직 새 호스트에 실제 배포하지 않았다. 새 공개 URL과 DB 이전 완료를 주장하지 않는다.
- 원본 PNG·게임 그래픽·캐릭터 승인 상태는 이 변경에서 바꾸지 않는다. 원본 업로드 PR #5와 독립된 변경이다.

## 한 번 필요한 운영 설정

GitHub 저장소 **Settings → Environments → production**에서 다음 값을 등록한다. 저장소 Variables/Secrets에 등록해도 workflow가 읽을 수 있다. 토큰 원문은 대화나 Git에 넣지 않는다.

| 종류 | 이름 | 내용 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | 대상 계정의 Worker 배포 권한. migration을 실행할 경우 대상 D1 쓰기 권한도 필요 |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | 실제 Cloudflare 계정 ID |
| Variable | `CAMP_WORKER_NAME` | 배포할 Worker 이름, 예: `huddlers-fire` |
| Variable | `CAMP_D1_DATABASE_ID` | 실제 대상 D1 UUID. 로컬 placeholder 사용 금지 |
| Variable | `CAMP_PUBLIC_URL` | 대상 Worker HTTPS origin. 마지막 `/` 없이 등록 |

Cloudflare 계정에서 운영할 Worker·D1 대상을 먼저 확인한다. 새 D1을 사용할 경우 기존 계정·프로필·방 데이터는 자동 이전되지 않는다. 기존 Sites 관리 DB를 소유자 계정의 D1처럼 임의 연결하지 않는다. 데이터 유지/이전과 기존 사이트 종료는 별도 결정이다. 새 빈 DB를 사용할 때는 첫 배포에서 migration 옵션을 켜 모든 migration을 한 번 적용한다.

운영 Worker의 서버 비밀값도 별도로 설정한다:

- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` 필수: Discord 개발자 앱에 새 `CAMP_PUBLIC_URL/api/camp/discord/callback`을 등록한다.
- TURN을 사용하면 `TURN_URLS`, `TURN_SHARED_SECRET`도 등록한다. 기존 값이 자동 복사되지는 않는다.
- 예: `npx wrangler secret put DISCORD_CLIENT_SECRET --name huddlers-fire`. Secret을 CLI 인자로 쓰지 않고 비공개 입력으로 전달한다.

배포 스크립트는 `--keep-vars`로 기존 서버 변수 구성을 유지한다. Worker secrets는 빌드나 GitHub 클라이언트 번들에 넣지 않는다.

## 배포 순서

1. 배포 변경을 main에 병합하고 GitHub **Actions → Verify and deploy**의 검사 결과를 확인한다. push 자체는 배포하지 않는다.
2. 대상 DB의 적용 이력을 확인한다. 기존 Drizzle/Sites DB가 `d1_migrations` 이력을 갖고 있다고 가정하지 않는다. 이미 SQL이 적용된 DB에서 migration을 다시 실행하지 않는다.
3. main에서 **Run workflow**를 누른다. `apply_migrations`는 검토한 미적용 migration을 적용할 때만 선택한다. 기본은 false다.
4. 전체 회귀·파이프라인·타입·lint·빌드가 성공하면 production 작업이 실제 대상 설정으로 다시 빌드하고 Wrangler dry run을 실행한다. 그다음 선택된 migration과 Worker 배포를 순서대로 수행한다.
5. 공개 HTML·`/api/camp/version` HTTP 응답을 확인한다. 이후 실제 Discord 로그인, 방 생성/입장, 두 브라우저 RTC·승계·라디오·자산과 새 release 식별자를 확인해야 이전 완료다. HTTP 성공만으로 게임 검증 완료를 주장하지 않는다.

배포 실행은 main만 허용하며 직렬 실행한다. PR 검사는 운영 토큰을 사용하지 않는다. 실패한 테스트나 누락 설정을 통과로 처리하지 않는다. 소스 롤백도 기존 방의 release fence를 되돌리지 않도록 새 빌드로 배포한다.

## 로컬 점검

`web/`에서 Node 24를 사용한다:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run test:deployment
npm.cmd run test:sprites:pipeline
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

실제 `CAMP_WORKER_NAME`, `CAMP_D1_DATABASE_ID`를 빌드 전에 설정한 경우 `npm.cmd run deploy:check`로 업로드 없이 확인한다. `npm.cmd run deploy`는 운영 변경 명령이므로 실제 배포 요청 범위에서만 실행한다.

Cloudflare 공식 근거: [GitHub Actions 배포](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Wrangler 구성](https://developers.cloudflare.com/workers/wrangler/configuration/), [D1 명령](https://developers.cloudflare.com/workers/wrangler/commands/d1/).
