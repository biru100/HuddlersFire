# 첫 NW 착의 시안 준비 · 하네스 후속 검증

## 환경과 기존 작업

2026-11-07, Windows PowerShell, Node v24.21.0 / npm 11.19.0. 시작 작업 트리는 깨끗했고 현재 브랜치는 `main`, 마지막 커밋은 `2deddaf463f874f6de2aee0173ac8d380f014e6f` (`Refactor pixel art workflow around external generation and explicit art approval`)였다. 로컬 추적 기준 `origin/main`과 `origin/art/quality-first-harness-20261107`도 같은 커밋이라 main 대비 미병합 diff는 없었다.

GitHub API로 [PR #1](https://github.com/biru100/HuddlersFire/pull/1)의 **closed / merged** 상태를 확인했다. 기존 변경은 이전 main `bfcde22` 대비 15파일, +636/-56이다. `camp-art-direction`, `camp-sprite-assets`, `camp-change-validation`과 활성 시각 제작·의도·장면·구조 문서를 읽고 기존 작업 브랜치를 로컬로 체크아웃해 이어갔다. 새 PR·main 병합·배포는 하지 않는다. 병합된 PR의 기존 결과와 이번 후속 결과를 구분해 기록한다.

## 발견과 수정

| 발견 | 조치와 범위 |
| --- | --- |
| 원본 수신이 수동 복사·receipt 편집에 의존 | 기존 rebuild에 `--source` / `--source-reference` 추가. 배타적 바이트 복사, 원본명·SHA256, null/unverified 실제 모델 상태를 보존. 중복 수신 거절. 원본이 바뀌면 다시 build해도 차단 |
| 실제 PNG inspector 통합은 이전 감사에서 미실행 | 기존 `pixel-assets.mjs:inspectImage`를 실제로 호출하는 수신/CLI 회귀 4개 추가. 별도 이미지 처리기는 추가하지 않음 |
| 기존 단위 테스트의 1픽셀 PNG를 불투명으로 가정했으나 실제 디코더는 완전 투명으로 읽음 | 실제 불투명 PNG fixture로 교체하고, 이전 파일은 실제 디코딩 결과로 `empty_image`가 차단됨을 검사. 최초 통합 검사 3개 실패를 이 원인으로 수정 후 4개 통과 |
| compact/rounded/graphic의 강조점이 짧고 유사함 | 비율·밀집도 / 부드러운 볼륨 / 색면·윤곽으로 차별화. 동일 인물·의상·시점·자세·중립광 고정. 곱슬 묶음, 내려진 후드, 긴 바지, 편한 양발과 팔의 idle을 명확히 함 |
| 검토 HTML은 명암 바탕 확대 비교만 제공 | 원본 100%, 종횡비를 보존한 작은 표시 가설, 모델 경고·차단 사유, 여섯 관찰 항목 추가. 실제 게임 조명/접지 검증과 분리 |
| 현재 스킬과 하네스의 수신 절차가 맞지 않음 | 프로젝트 로컬 미술/스프라이트 스킬에 다운로드 원본·수신 CLI·변경 축·통합 검사 안내 반영. 관련 링크 회귀 추가. 전역 설정은 수정하지 않음 |

새 원화나 기각 결과의 변환본을 제작하지 않았다. 테스트 PNG는 1픽셀의 합성 fixture이며 캐릭터 원화·미술 승인 기록으로 사용하지 않는다.

## 실행 결과

모든 npm 명령은 `web/`에서 실행했다. 명령별 수치는 포함 관계이며 합산하지 않는다.

| 검사 | 결과 | 범위 / 로컬 로그 |
| --- | --- | --- |
| 시작 시 `npm.cmd test` | 283/283 PASS | 기존 기능·하네스 기준선, `/outputs/art-first-baseline-tests.log` |
| 보강 후 `npm.cmd test` | 291/291 PASS | 기존 기능 + 규칙/스킬 + 실제 PNG/CLI, `/outputs/art-first-final-tests.log` |
| `npm.cmd run test:art-direction` | 31/31 PASS | 출처·승인·변형 금지·수신 덮어쓰기·스킬 참조 |
| `npm.cmd run test:art-intake` | 4/4 PASS | 실제 PNG 디코딩·미변경·빈 이미지·native 차단·기존 CLI·HTML |
| `npm.cmd run test:sprites:pipeline` | 68/68 PASS | 기존 조립/정합성/미승인·stale evidence + 새 통합 검사, `/outputs/art-first-pipeline.log` |
| `npm.cmd run typecheck` | PASS | 기존 앱 타입 검사 |
| `npm.cmd run build` | PASS | 기존 앱 전체 빌드, `/outputs/art-first-build.log`. 하네스/테스트/문서 변경은 런타임 빌드 소스를 바꾸지 않음 |
| `npm.cmd run test:render` | PASS | 기존 Canvas 렌더 다중 장면, `/outputs/art-first-render.log` |
| `npm.cmd run test:network` | PASS, HTTP 1,537회 | 격리 loopback API + 실제 Node WebRTC. 최대 16명, 재접속·정상/비정상 방장 승계·상태 유실·scheduler lag 회복. `/outputs/art-first-network.log` |
| `npm.cmd run test:browser:art-review` | PASS | 일회성 headless Chrome, 테스트 PNG의 1280×1000 / 390×844 HTML·원본 로딩·5개 보기·가로 넘침 없음 |
| `npm.cmd run lint` | PASS, 기존 런타임 경고 4개 | camera/canvas-renderer/renderer/world. 이번 수정 테스트의 불필요한 import 경고는 제거 |
| `git diff --check`, 요청문 snapshot·job·문서 링크 확인 | PASS | 최종 rounded TXT가 실제 생성 요청과 일치. 세 job 모두 원본/승인 없음 |

빌드가 표시하는 일부 route 분류 unknown 안내는 vinext 정적 분석의 한계이며 build 종료 코드 0이었다. 처음 실행한 headless 검사는 샌드박스에서 `CDP timeout Runtime.enable`로 실패했다. 페이지를 열기 전 단계였으며, 일회성 격리 프로필을 일반 실행 권한으로 실행하자 같은 검사가 통과했다. 개인 브라우저·데스크톱 UI 제어 도구는 사용하지 않았다. 테스트용 API 서버는 검사 뒤 종료했다.

## 직접 확인한 화면과 한계

- 기존 Canvas `web/outputs/campfire-focus.png` (1050×824), `campfire-focus-mobile.png` (390×620)을 열었다. 불·좌석·이름/사진·대화가 그려지지만 넓은 시야에서는 인물 자체가 작다. 새 원화는 확대 이미지의 디테일보다 작은 표시에서 머리·후드·바지·신발이 읽히는지 함께 확인해야 한다. 이 관찰로 카메라나 맵을 변경하지 않았다.
- `/outputs/art-review-smoke-mobile.png`와 데스크톱 캡처는 테스트용 흰 1픽셀 PNG의 검토 페이지다. 모바일의 경고·배경 패널과 원본 보기 준비를 확인했다. 새 캐릭터의 품질을 확인한 화면이 아니다.
- 앱 런타임·공개 스프라이트·catalog·scene-spec·네트워크 계약·DB·로그인/사진을 수정하지 않았다. 실제 게임 WebGL·전체 앱 UI·브라우저 WebRTC·실기기·실인터넷 NAT 검사는 이번에 실행하지 않았다. Canvas·Node WebRTC·검토 HTML 검사를 이 근거로 대신하지 않는다.

## 제작 준비 상태와 다음 단계

첫 전달물은 [rounded 최종 요청문](../briefs/nw-clothed-lookdev-01.txt)과 [정확한 전달 안내](../briefs/nw-clothed-lookdev-01.md)다. `lookdev-nw-rounded-01`, `lookdev-nw-compact-01`, `lookdev-nw-graphic-01` job을 각각 준비했다. 모두 `awaiting_external_art`, `generated:false`이며 원본·기술 intake·미술 승인·실제 캐릭터 게임 화면은 아직 없다. 실행별 job은 기존 Git 제외 정책을 유지한다.

사용자가 ChatGPT 다운로드 원본 PNG를 첨부하거나 전체 로컬 경로를 주면, 기존 CLI로 해시 보존 수신 → 실제 inspector → 오프라인 검토 페이지 → 구체적인 미술 관찰을 진행한다. 사용자 선택이 있어야 그 원본 해시를 부모로 native-base 한 컷을 요청한다. 이후 소수 NW 레이어와 실제 캠프 한 구역을 검증한다. native 납품이 불가능하면 `blocked_native_delivery`로 남기고 제작 방식/해상도 결정을 분리한다. 그전에는 강제 축소·양자화·자동 반전·가려진 신체 추출로 확장하지 않는다.
