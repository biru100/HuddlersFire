# PR #5 · GitHub 원본 업로드 검증

## 최종 후속 결과: 원본 4/4 GitHub 업로드 및 재검증 완료

- **승인 NW 디자인:** `art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png`, 521,850바이트, SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`.
- **승인 SE 디자인:** `art/sprites/source-registry/rounded02-rev2-lookdev/original/se-approved.png`, 521,444바이트, SHA256 `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2`.
- 두 파일의 원본은 해당 ChatGPT 대화의 작업 공간에서 회수했다. [원본 저장 커밋](https://github.com/biru100/HuddlersFire/commit/602c28c5c897e7425cbb328bf1f7d9cdeb6b70ba)에서 직접 `fetch_file(encoding=base64)`로 재조회해 바이트를 복원하고 SHA256을 독립 계산한 결과 정확히 일치했다.
- Idle NW·SE는 이전 커밋 `f822f7b`에서 이미 HTTP 200 원본 SHA256 확인됐으며, 같은 `602c28c` 커밋에서도 각각 정확한 Git Blob SHA와 원본 바이트 길이가 일치했다.
- [전체 검증 기록](../../art/sprites/source-registry/REMOTE_VERIFICATION.json)은 작업에 필요한 네 원본의 고정 커밋 경로와 서로 다른 검증 방식을 구분해 기록한다.
- 기존 테스트 308/308, 모션 6/6 및 빌드 PASS는 아래 과거 Codex 검사 근거다. 이번 회수·바이너리 커밋 단계에서는 애플리케이션 코드를 수정하거나 전체 테스트를 재실행하지 않았다.
- **미술 및 제작 경계:** NW·SE 디자인 LOOKDEV는 사용자가 선택했지만, Idle 모션 미술 승인은 여전히 pending이다. 64×96 네이티브 스프라이트, 실제 게임 렌더, 배포는 미완료다.

## 이전 검사 시점: 2/4 원격 검증 완료, 병합 보류

대상: [PR #5](https://github.com/biru100/HuddlersFire/pull/5), `art/github-original-source-workflow-20261107`.
하네스 회귀와 빌드는 통과했다. Idle NW·SE 두 PNG는 정확한 원본 바이트로 커밋·푸시하고 GitHub에서 새로 내려받아 검증했다. 승인 디자인 NW·SE 두 원본은 찾지 못했다. 사용자 지시에 따라 네 원본이 모두 검증되기 전에는 병합하지 않는다.

## 실제 원격 파일

원본 업로드 커밋: `f822f7b89a28aae7696abf6a611b0b480b8bcd53`.
검증 시각: `2026-11-07T14:24:52.002Z`.
로컬 Git 객체를 재사용하지 않고 commit-pinned `raw.githubusercontent.com` URL로 새 HTTP 요청을 보냈다. 응답 바이트에서 SHA256을 다시 계산했다.

| 원본 | 원격 결과 | 바이트 | 실제 SHA256 |
| --- | --- | ---: | --- |
| [Idle NW PNG](https://raw.githubusercontent.com/biru100/HuddlersFire/f822f7b89a28aae7696abf6a611b0b480b8bcd53/art/sprites/source-registry/rounded02-idle-motion-01/original/nw-idle-4cut-v1.png) | HTTP 200, 일치 | 685555 | `7abce57cf6e2cd4a4f2611d9cabb652a40526b7faac26a229b4ba1aafa404581` |
| [Idle SE PNG](https://raw.githubusercontent.com/biru100/HuddlersFire/f822f7b89a28aae7696abf6a611b0b480b8bcd53/art/sprites/source-registry/rounded02-idle-motion-01/original/se-idle-4cut-v1.png) | HTTP 200, 일치 | 709599 | `1483c3c713929c407f0e427096d92dcf9b3fd0a995e08058369e4b3b792da929` |

두 파일 모두 1254×1254. 기존 로컬 `art/sprites/incoming/rounded02-idle-motion-01/original/rounded02_rev2_idle_nw.png`, `rounded02_rev2_idle_se.png`에서 `ingest`로 무손실 보존했고 `verify`도 통과했다. [기계 판독 검증 기록](../../art/sprites/source-registry/rounded02-idle-motion-01/REMOTE_VERIFICATION.json)에 요청 주소·HTTP 결과·실제 해시가 있다. ChatGPT는 위 고정 PNG 주소를 직접 참조한다. ZIP을 새로 만들지 않았다.

## 누락된 승인 디자인 원본

| 필요한 원본 파일 | 예상 바이트 | 필요한 SHA256 | 상태 |
| --- | ---: | --- | --- |
| `곱슬머리_소년의_후면_픽셀_아트.png` → `rounded02-rev2-lookdev/original/nw-approved.png` | 521850 | `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a` | `missing_original`, 원격 HTTP 404 |
| `세이지_후디를_입은_곱슬머리_소년_스프라이트.png` → `rounded02-rev2-lookdev/original/se-approved.png` | 521444 | `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2` | `missing_original`, 원격 HTTP 404 |

두 파일은 각각 1086×1448이어야 한다. 프로젝트, 현재 AgentHub 대화 첨부 폴더, Downloads의 PNG **5,696개**를 조사했다. 예상 바이트 크기와 일치한 PNG 2개는 모두 위 Idle 원본이었다. 접근 실패 디렉터리는 없었다. `.git`, `node_modules`, 빌드·캐시·내부 도구 폴더는 검색에서 제외했다. 전역 사용자 데이터 전체를 조사한 것은 아니다. 상세 로컬 검색 기록은 `outputs/pr5-original-search.json`에 남겼다.

로컬 Rev2의 `7e6b…` / `0e76…` 후보는 승인 해시와 다르므로 대신 업로드하지 않았다. 기존 원본·리뷰·승인 문서와 manifests의 기대값은 보존했다. 필요한 조치는 위 SHA256의 실제 PNG 두 장을 GitHub에 직접 제공하거나 PNG 첨부로 전달하는 것이다. 확보 후 같은 ingest/verify → commit/push → 원격 바이트 재검증을 적용한다.

## 발견·수정한 하네스 오류

Windows 체크아웃의 `SHA256SUMS.txt`가 CRLF가 되면서, 기존 6개 fixture 테스트가 통과해도 실제 tracked manifest는 `Checksums file differs from manifest`로 차단됐다.

- `tools/art-source-registry.mjs`: 체크섬 **텍스트의 CRLF만 LF로 정규화**해 비교한다. PNG 바이트·해시·크기 검사는 그대로 엄격하다.
- `.gitattributes`: 레지스트리 체크섬 텍스트에 `text eol=lf`를 명시한다. PNG binary 규칙은 유지한다.
- `web/tests/art-source-registry.test.mjs`: CRLF 정상값 통과/변조값 거부와 실제 두 manifest 로딩의 회귀를 추가했다.
- 원본 PNG 두 파일, 상태 README 3개, 이 실행 기록과 원격 검증 JSON을 같은 PR에 반영했다.

## 실제 실행한 검사

| 검사 | 결과 |
| --- | --- |
| `npm.cmd run test:art-source-registry` | 8/8 PASS |
| `npm.cmd run test:art-direction` | 34/34 PASS |
| `npm.cmd run test:motion-lookdev` | 6/6 PASS |
| `npm.cmd run test:art-intake` | 4/4 PASS |
| `npm.cmd test` | 308/308 PASS |
| `npm.cmd run test:sprites:pipeline` | 85/85 PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개 |
| 실제 Idle `ingest` / `verify` | 두 원본 SHA256·크기·PNG 헤더 일치 |
| 실제 두 registry manifest 로딩 | PASS |
| GitHub 원격 PNG 재다운로드 검증 | Idle 2 PASS, 디자인 2 누락 |

부분 테스트는 전체 테스트와 중복되므로 합산하지 않는다. 빌드의 vinext 정적 라우트 분류 안내와 lint의 기존 camera/canvas-renderer/renderer/world 경고는 실패가 아니다. 로컬 로그: `outputs/pr5-final-tests.log`, `outputs/pr5-final-pipeline.log`, `outputs/pr5-build.log`, `outputs/pr5-lint.log`. 이번 변경에는 브라우저 렌더·실제 캠프 장면 검증을 실행하지 않았다.

## 승인·게임 경계

문서상 디자인 선택은 `selected-lookdev`지만 승인 해시의 원본이 없어 실제 부모 job 연결은 보류다. Idle은 `pending-motion-review`를 유지한다. 업로드를 미술 승인으로 간주하지 않았고 `productionReady:false`, `runtimeVerified:false`도 유지했다. 기존 `art-direction` 정책·fingerprint·리뷰를 변경하지 않았다. main 대비 게임 코드·public 자산 변경이 없으며 네이티브 제작·게임 자산 교체·공개 배포를 하지 않았다.
