# 2026-11-07 그래픽 제작 경로 감사와 수정 기록

## 범위와 결론

검토 기준은 GitHub `biru100/HuddlersFire`의 `bfcde221da42577d93327d5f6b6cc7db34aa04de`다. AGENTS, 프로젝트/장면/구조 문서, 스프라이트 스킬, scene spec의 픽셀 계약, prepare/rebuild/review, pixel-assets, avatar-assembly, 렌더 진입점, 기존 pixel 테스트 및 package scripts를 확인했다. 전체 서비스의 보안/네트워크 감사를 완료했다는 의미가 아니다.

사용자가 현재 결과의 품질을 낮게 평가하고 ChatGPT 원화 제작 + Codex 조립으로 하네스/스킬 수정을 요청했다. 기존 시안과 NW 기본 신체는 승인된 픽셀 기준으로 취급하지 않는다. 이번 변경은 생성 이미지를 추가하거나 공개 게임 그래픽을 개선한 결과물이 아니라, 잘못된 기준의 확산을 막고 더 좋은 시안을 선택하는 제작 경로 개편이다.

## 확인한 강점

- `pixel-assets.mjs`는 원본/명세/런타임 해시와 실제 alpha, 팔레트, stale evidence를 검사한다. 픽셀 후보가 운영 기본값을 덮어쓰지 않는다.
- `camp-avatar-assembly.mjs`는 부족한 방향/레이어를 부분 성공으로 돌려주지 않는다. 로컬 아바타 draft와 온라인 Member/Player/사진을 분리했다.
- `scene-composition.md`는 사람, 좌석, 길, UI의 관계와 실제 renderer 증거를 이미 요구한다. 이 장치를 버릴 필요는 없다.

## 병목과 조치

| 사실 / 문제 | 왜 품질을 막는가 | 이번 조치 |
| --- | --- | --- |
| sprite 스킬은 외부 ChatGPT 문단과 내장 imagegen 생성 단계가 함께 있음 | 어떤 표면/모델에서 새 원화를 만들지 불명확 | 신규 제작은 외부 경로, 기존 sprite-gen은 구 원화 재현으로 명시 분리 |
| 정확한 64×96와 NW 신체부터 요청하지만 승인된 매력적인 캐릭터가 없음 | 크기·앵커만 맞춘 부실한 원형이 늘어날 위험 | 먼저 NW 착의 시안을 선택. 네이티브 납품과 시안은 별도 판정 |
| pixel prepare/build는 전체 catalog와 공통 cases를 묶음 | 작은 디자인 비교가 수십 후보·UI 검사에 종속 | 같은 CLI 안에 가벼운 `--art` job 추가. 실제 pixel 장면 게이트는 유지 |
| `usable_as_is`/review 관찰은 있으나 사용자 미술 선택 계보가 별도 계약이 아님 | 기술 PASS를 선택으로 잘못 보고할 여지 | 원본·모델 출처·미술 결정·부모 참조·최종 pilot 해시 연결 |
| 과거 normalization 재현이 평범한 CLI 옵션으로 남음 | 기각된 강제 가공이 새 제작에 재사용될 위험 | 명시적 역사 재현 플래그 없이는 거절. 원본 유지 |
| avatar state contract가 없는데 후속 코드에서 `contract.states[state]` 접근 | 안전한 미완료 대신 TypeError 발생 가능 | 누락/불완전 계약은 빈 layers와 이유를 반환 |
| 모든 부품 canvas가 서로만 같으면 됨 | 모두 같은 잘못된 크기도 승인 계약과 다를 수 있음 | 계약 canvas가 주어지면 각 variant와도 비교 |
| 과거 문서에 서로 다른 시점의 '최신' 설명이 누적 | 오래된 일러스트/사진/제작 규칙을 새 아트에 섞기 쉬움 | AGENTS에서 활성 시각 제작 경로를 단일 진입점으로 지정. 기존 역사/기능 문서는 삭제하지 않음 |

## 미술적 판단

낮은 완성도를 모델 차이 하나로 설명할 근거는 없다. 모델을 바꿔도 약한 기준작, 과도한 동시 요구, 시점 혼합, 실제 표시 크기 미검토는 남는다. 반대로 규격 검사를 늘려도 캐릭터의 매력은 생기지 않는다.

우선 필요한 것은 큰 머리 아래 읽히는 몸·손발, 뒤통수/어깨/골반/발의 일관된 NW 회전, 단순한 옷 실루엣, 통일된 색면이다. 맵을 전면 교체하기 전에 사람 한 명과 벤치 하나가 같은 공간에 놓였을 때 좋아 보여야 한다. **원화 선택 → 실제 논리 픽셀 납품 → 게임 합성**으로 구분한다. 화풍 시안의 고해상도 출력은 사용 가능 원본이 아니다.

고정 쿼터뷰, 놀이 기능, 사진, 로그인/RTC, 맵/좌석의 권위, 팬/줌은 바꾸지 않는다. 신규 커스터마이징의 서버 동기화도 이번에 추가하지 않았다.

## 모델 관련 경계

정책의 요청 모델은 사용자의 지정인 `gpt-image-2.6`이다. 특정 Codex 환경이 어떤 이미지 모델을 실제 호출하는지는 이 감사에서 확인하지 않았다. OpenAI의 Images 2.6 공개 안내는 ChatGPT/Codex/API 제공을 설명하지만 개인 환경의 실행 증거는 아니다. 출처: https://openai.com/index/introducing-images-2-6/ (2026-11-07 확인).

하네스는 requestedModel과 observedModel을 분리한다. 확인되지 않은 모델은 null/unverified이고, 다른 모델이나 Codex 생성으로 대체한 receipt는 차단한다. 이 정책은 모델 성능 비교 실험 결과가 아니다. 네이티브 64×96 생성 능력을 보증하지 않는다.

## 실행한 검증

로컬 Node v22.16.0에서 실제 변경 파일을 대상으로:

- `node --test web/tests/art-direction.test.mjs`: **27/27 PASS**.
- `cd web && npm run test:art-direction`: **27/27 PASS**.
- 변경된 7개 `.mjs` 파일의 `node --check`: PASS.
- 변경 JSON 파싱: PASS.

테스트는 임시 합성 fixture로 경로 이탈/덮어쓰기 거절, 원본/receipt/계약/참조 변경, 미술 승인 구분, 모델 대체/가공 차단, 네이티브 크기·alpha·팔레트·앵커, 아바타 회귀를 확인한다. 테스트용 승인 기록은 실제 사용자 승인이 아니다. PNG 디코딩을 포함하는 `buildArtJob`의 기존 Canvas inspector 통합 실행은 이 환경에서 수행하지 못했다.

## 미실행과 남은 일

실행 환경에서 GitHub clone/npm 의존성 설치를 위한 네트워크 연결을 사용할 수 없어 연결 도구로 실제 소스를 읽고 필요한 변경 파일을 로컬에서 테스트했다. **전체 npm test, 기존 pixel pipeline, typecheck/build, 실제 Canvas/WebGL/브라우저/UI/멀티플레이 검사는 미실행**이다. 정적 HTML 결과를 그 증거로 대신하지 않았다. 완전한 저장소와 설치된 의존성이 있는 환경에서 병합 전 수행해야 한다.

아직 새 미술 후보·승인된 기본 신체·레이어·스크린샷은 없다. main 및 공개 배포를 변경하지 않는다. `--art` 단일 이미지 승인만으로 다른 방향/동작/모든 스프라이트의 완성을 선언할 수 없다. Pixel 최종 CLI는 추가 미술 계보를 요구하지만 `verifyPixelReview` 저수준 함수는 기존 정합성 검사로 유지했다. 새 자동 production installer는 없다.

## 바로 다음 작업

`node tools/prepare-sprite-job.mjs --art --stage lookdev --variation compact --out lookdev-nw-01`로 첫 요청을 만들고 실제 ChatGPT 원화를 받는다. 별도 후보를 만들면 새 job을 쓴다. 사용자가 보고 선택하기 전에는 native-base/레이어 생산으로 넘어가지 않는다. 상세 절차는 [시각 제작](../visual-production.md) 한 곳에서 유지한다.
