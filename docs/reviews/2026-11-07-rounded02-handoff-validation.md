# Rounded 02 · ZIP 보존과 PR #2 후속 검증

## 기준과 결과

2026-11-07, Windows PowerShell / Node v24.21.0. 사용자 지정 [PR #2](https://github.com/biru100/HuddlersFire/pull/2)는 open이며 HEAD는 `48be5e53cb28ded41287fe80ecf8c18bb5686e45`였다. 깨끗한 로컬 기존 작업 브랜치 `2581601`을 fetch + fast-forward해 그 코드를 기준으로 검사했다. PR #2는 ChatGPT 평가 출처·NW/SE 각각의 사용자 원본 선택·두 승인 참조를 네이티브/최종 pixel review 게이트에 추가한 상태다.

**완료:** ZIP 원본·내부 참고 파일 보존, manifest 대조와 실제 PNG 디코딩, 하네스/스킬 회귀, Rounded 02 두 독립 lookdev job 및 전달 요청서 준비. **미완료/대기:** 새 NW·SE 원본, ChatGPT의 그 원본 평가, 사용자 선택. 실제 네이티브 스프라이트 제작·게임 적용·공개 배포는 진행하지 않았다.

## 수신 자료

보존 위치: `art/sprites/incoming/lookdev-handoff-v2/`. ZIP SHA256 `a80bbdae68f19ce6ece5fc3b894985a7cc3f1aecac8f0ba8d56a0fa11cd3bf0e`, 4,326,527바이트. 원본 ZIP과 내부 PNG 3개·MANIFEST.json·README_KO.txt를 바이트 그대로 저장했다. 원본 텍스트는 디렉터리 `.gitattributes`로 Git 줄바꿈 변환도 막았다. 첨부 안의 코드는 실행하지 않았고 실제로 데이터 파일 5개만 있었다.

| 파일 | 실제 크기 | alpha 0 / 255 / 중간값 픽셀 | 역할 |
| --- | --- | --- | --- |
| Rounded 01 NW | 1086×1448 | 987,246 / 516 / 584,766 | 미승인 과거 시안 |
| Rounded 02 A/B 보드 1 | 1536×1024 | 35,196 / 0 / 1,537,668 | 참고용 비교판 |
| Rounded 02 A/B 보드 2 | 1536×1024 | 0 / 0 / 1,572,864 | 참고용 비교판 |

세 PNG의 SHA256·파일 바이트 수·실제 크기가 ZIP manifest와 모두 일치했다. 상세 해시·bounds·alpha는 `technical-intake.json`에 있다. 반투명 픽셀이 있으므로 네이티브 이진 알파 납품이 아니다. 이 기술 관찰은 미술 평가, 인물/방향의 의미 판정, 실제 모델 검증을 뜻하지 않는다. 실제 모델은 모두 `null/unverified`로 보존했다.

이 파일들을 `source/candidate.png`·catalog·런타임 manifest에 연결하지 않았다. 보드의 인물을 잘라내거나 반전·축소·양자화하지 않았다. Rounded 01을 Rounded 02로 재지정하지 않았다.

## 발견과 수정

`test:art-direction`은 PR #2 HEAD에서 34/34 통과했지만 `test:art-intake`는 3/4였다. 기존 native 디코딩 회귀의 테스트 fixture가 새 `artDirectorReview`와 별도 승인 SE job을 제공하지 않아 실제 PNG 크기 차단까지 도달하지 못했다. 테스트 전용 평가 출처·같은 variation의 SE companion을 fixture에 추가했다. 첫 수정 후 SE의 기본 variation compact와 NW rounded가 달라 다시 거절됐고 이를 부모와 일치시켰다. 최종 통합 4/4 및 전체/파이프라인 검사가 통과했다. 실제 이미지 평가/사용자 승인 기록을 만들거나 게이트를 완화하지 않았다.

프로젝트 로컬 두 스킬과 활성 문서에는 참고 ZIP의 분리 보존과 새 파일 미수신 상태를 연결했다. PR #2 브리프의 기존 미술 관찰은 ChatGPT 대화의 이력으로 표시하고, “저장소에 바이너리 없음”을 실제 과거 참고 자료 수신 상태로 갱신했다. 하네스 구현·게임 런타임·공개 스프라이트·scene-spec·catalog·DB는 변경하지 않았다.

## 실행한 검사

각 npm 명령은 `web/`에서 실행했다. 테스트 수는 포함 관계이며 합산하지 않는다.

| 명령 / 검사 | 최종 결과 | 범위 |
| --- | --- | --- |
| `npm.cmd run test:art-direction` | 34/34 PASS | 출처·미술/사용자 승인·NW/SE 게이트·스킬 링크 |
| `npm.cmd run test:art-intake` | 4/4 PASS | 실제 디코딩·원본 유지·중복 수신·native 크기 차단·CLI |
| `npm.cmd run test:sprites:pipeline` | 71/71 PASS | 기존 조립·정합성·stale evidence + 아트/수신 |
| `npm.cmd test` | 294/294 PASS | 기존 기능과 하네스 전체 회귀 |
| `npm.cmd run typecheck` | PASS | 앱 타입 검사 |
| `npm.cmd run build` | PASS | 앱 전체 빌드. vinext의 일부 route 분류 unknown 안내는 실패가 아님 |
| `npm.cmd run test:render` | PASS | 기존 Canvas 다중 장면 렌더. 새 이미지 미적용 |
| `npm.cmd run test:browser:art-review` | PASS | 테스트 PNG의 일회성 headless 데스크톱/모바일 HTML. 일반 실행 권한 사용 |
| `npm.cmd run lint` | 오류 0, 기존 경고 4 | camera/canvas-renderer/renderer/world의 기존 경고 |
| `git diff --check`, 문서 링크·요청문·보존 해시 검사 | PASS | 요청문과 실제 job 일치, 두 source 비어 있음 |

로그는 `/outputs/rounded02-*.log`에 보존했다. 최초 실패와 최종 통과를 구분한다. 테스트에 쓰는 1픽셀 합성 PNG·가짜 평가/선택은 테스트 데이터일 뿐 실제 원화·승인 증거가 아니다. 이번에는 실제 새 캐릭터 미술/게임 화면, 전체 앱 WebGL/UI, 실물 기기·외부 인터넷·실제 네트워크 통합은 검사하지 않았다. 과거 `2581601`의 검사 결과를 이번 증거로 재사용하지 않았다.

## 전달 준비와 남은 단계

두 job `lookdev-nw-rounded-02`, `lookdev-se-rounded-02`를 현재 정책에서 생성했다. `view:nw/se`, `variation:rounded`, `stage:lookdev`이며 `source/`는 비었다. 사용자 승인·네이티브 job은 생성하지 않았다. job은 기존 정책대로 Git 제외 로컬 실행 데이터이며, 재현 명령과 요청문은 [전달 환경](../briefs/rounded-02/README.md)에 저장했다.

ChatGPT 전달용 `/outputs/rounded-02-chatgpt-handoff.zip`은 README·공통 맥락·NW/SE 요청문·참고판 2개·패키지 manifest의 7항목이다. 여섯 내용 파일의 해시를 ZIP에서 다시 읽어 원본과 대조했다. 패키지 SHA256 `bec98667a20c77d30f61a7f4d5794366c078d6cf21bcae1e98dbe0dbd263353d`. 이 ZIP에도 새 NW·SE 원본은 없다.

필요 파일은 **`rounded-02-nw.png`, `rounded-02-se.png`**다. 같은 인물의 착의 idle·한 방향 한 명·실제 투명 배경 PNG를 ChatGPT에서 별도로 제작해 다운로드 원본 그대로 전달한다. 실제 원본별 ChatGPT 평가 출처와 사용자 선택은 별도로 받아 기록한다. 이후 기술 수신 → ChatGPT 평가/사용자 선택의 두 방향 게이트 → 다음 제작 결정 순서다. 현재 단계에서 네이티브나 공개 배포를 진행하지 않는다.
