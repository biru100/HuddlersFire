# GitHub 배포 경로 전환 검증

## 변경 범위

사용자 “사이트배포 gpt에서 하는건 삭제하고 깃허브로 해주라” 요청에 따라 main `ba344ba3da65fc0c078c9f556f209e84e3610991`에서 독립 브랜치 `ci/github-deployment-20261107`를 만들었다. 작업 도중 main이 `9b893b664e46b5bb8b19e7500816c8672ae094d2`로 갱신돼 원본 업로드 PR #5의 네 PNG 복구와 레지스트리 변경을 배포 브랜치에도 합쳤다. AGENTS의 두 GitHub 정책과 package.json의 레지스트리·배포 테스트를 모두 보존했다. 기존 로컬 원화·리뷰와 Rounded 02 README 메모는 stash와 `outputs/pre-pr5-local-rounded02-README.md`에 보존돼 있다.

- `.github/workflows/deploy.yml`: PR/main 검사와 main 수동 production 배포. PR은 운영 Secret을 사용하지 않으며 자동 push 배포는 없다.
- `web/vite.config.ts`: Sites hosting manifest 의존을 제거하고 `DB` 바인딩을 환경의 실제 D1 UUID로 구성한다. 로컬 placeholder는 유지하고 배포 진입에서 거부한다. Sites/connector 도구는 serve에만 적용한다.
- `web/.openai/hosting.json` 삭제, `web/scripts/vite/sites-vite-plugin.ts`의 Sites 배포 패키징 훅 제거. 개발용 인증 목은 유지한다.
- `web/scripts/deploy-cloudflare.mjs`: 대상 Worker/D1·자격증명·서버 빌드·미리보기 바인딩 검사, dry run, 명시적 pending migration 적용, Worker 업로드. 비밀값을 출력하지 않는다.
- `web/tests/deployment.test.mjs`, npm 명령 추가. 잘못된 대상과 dry run에서 DB mutation을 차단하는 회귀를 전체 테스트에 포함했다.
- 프로젝트 AGENTS·의도·README·Discord 안내·검증 스킬과 [배포 안내](../github-deployment.md)를 GitHub 기준으로 갱신했다. 과거 공개 배포 이력은 삭제하지 않았다.

## 실제 로컬 실행

| 명령/검사 | 결과 |
| --- | --- |
| `npm.cmd test` | 최초 302/302 PASS, 최신 main 병합 후 **310/310 PASS** (레지스트리 8개 포함) |
| `npm.cmd run test:deployment` | 2/2 PASS (전체와 중복) |
| `npm.cmd run test:sprites:pipeline` | 최초 77/77 PASS, 최신 main 병합 후 **85/85 PASS** |
| `npm.cmd run test:art-direction` | 34/34 PASS (위와 중복) |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개 |
| CI 대상 환경으로 build + `npm.cmd run deploy:check` | PASS, Wrangler 4.92.0 `--dry-run: exiting now`, **업로드 없음** |
| Actions YAML 파싱, `git diff --check` | PASS |
| main 대비 `web/app`, `web/lib`, `web/public` | 변경 없음 |

Dry run은 실운영 UUID가 아닌 명시적인 합성 CI UUID와 `huddlers-fire-ci` 이름을 사용했다. 첫 시도는 Windows sandbox 상위 경로 읽기 제한으로 실패했고, 업로드 없는 동일 명령을 권한 밖에서 재실행해 통과했다. 운영 D1 연결이나 migration 실행의 증거로 해석하지 않는다. build의 vinext 라우트 자동 분류 안내와 lint의 기존 4개 경고는 실패가 아니다.

실행 로그: `outputs/github-deployment-tests.log`, `github-deployment-pipeline.log`, `github-deployment-merged-tests.log`, `github-deployment-merged-pipeline.log`, `github-deployment-art-tests.log`, `github-deployment-typecheck.log`, `github-deployment-build.log`, `github-deployment-ci-build.log`, `github-deployment-dryrun.log`, `github-deployment-lint.log`.

## 운영 차단 및 남은 단계

GitHub CLI로 저장소 Secret/Variable **이름 목록**과 Environments 목록을 조회했다. 모두 비어 있다. 비밀값은 읽거나 출력하지 않았다. 따라서 실제 Cloudflare 배포·D1 migration·데이터 이전·새 공개 URL 검증·실제 Discord/RTC 검증은 수행하지 않았다. GitHub Actions Linux 실행 결과는 PR에서 별도로 확인해야 하며 이 로컬 결과와 구분한다.

운영자 설정이 필요한 항목: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CAMP_WORKER_NAME`, `CAMP_D1_DATABASE_ID`, `CAMP_PUBLIC_URL`, 대상 Worker의 Discord/TURN 서버 비밀값 및 DB migration 이력. 새 호스트 검증 전 기존 사이트·DB를 삭제하지 않는다. 원화·게임 자산·미술 승인·통신 규약은 바꾸지 않았고 실제 공개 배포 완료로 보고하지 않는다.
