# 일러스트 스프라이트 제작과 런타임

**현재 로컬 필드: INT-18 / field-v2 / 규약 v19.** 새 재킷 캐릭터, 네 착석 방향, 두 벤치 축과 모든 시설·효과·지형을 이전 이미지 없이 제작한다. 기본 명세는 `art/sprites/scene-spec.json`, 설치 절차는 [제작 경로](sprite-authoring.md)의 v2 절을 따른다. 아래 INT-17의 체형·셀 크기·공개 v18 기록은 이전 이력이다. 16개 동작의 의미와 여섯 색/다크·원형 Discord 사진·공식 게임 콘텐츠는 유지한다.

2026-11-05 INT-17 구현. 기존 기하형 캐릭터/시설/효과를 부드러운 구아슈 일러스트로 교체했다. 게임 로직은 기존 권위 모델을 사용하며, 자산 생성은 앱 실행과 분리한다.

**후속 제작 경로:** 신규 생성의 명세·부분 제작·방향/접촉 메타데이터·격리 미리보기·검토 gate는 [작업 안내](sprite-authoring.md)를 따른다. 아래 20개 원본/22개 런타임 PNG/63프레임은 기존 공개 자산의 재패킹 계약이다. 별도 `art/sprites/pilot-source/`의 5개 파일럿 원본은 정식 자산을 교체하거나 앱에 배포한 파일이 아니다.

## 도구와 원본

- 원본: `art/sprites/source/`의 20 PNG(약 19.94 MB). 기본 캐릭터 1개, 동작 strip 16개, 환경/효과/재질 sheet 각 1개.
- 도구: [aldegad/sprite-gen](https://github.com/aldegad/sprite-gen), 3.15.0, commit `4f5ccd55c7cf06685a41f954acc1e476b7772ece`, Apache-2.0. 저장소 전체는 `tools/sprite-gen/`에 로컬 설치하며 Git 추적/앱 배포에서 제외한다.
- Python 3.13, Pillow 12.3.0, NumPy 2.5.4. `tools/setup-sprite-gen.mjs`는 uv로 프로젝트 안에 설치한다. `SPRITE_GEN_UV` 환경변수로 uv 실행 파일을 지정할 수 있다. 전역 설정을 변경하지 않는다.
- 신규 생성: 내장 `image_gen`, 기준 캐릭터와 sprite-gen 레이아웃 가이드 참조. 유료 API 호출·자동 대체 경로 없음. 사진 머리/공식 게임 이미지는 생성 입력에 포함하지 않는다.

## 재현

프로젝트 루트에서 다음 명령을 실행한다. 첫 설치만 네트워크가 필요하다. 최종 PNG/manifest는 저장소에 포함하므로 일반 `web` 빌드에 Python이나 생성기 설치가 필요하지 않다.

```powershell
node tools/setup-sprite-gen.mjs
node tools/rebuild-sprites.mjs
```

재생성은 원본을 읽어 새로운 `art/sprites/runs/rebuild-<timestamp>/`에 결과를 만든다. `prepare`의 기준 셀은 128×128, Lanczos, pixel-unfake 비활성, bottom grounding이다. `extract`는 63프레임의 실제 alpha를 추출하며 `compose-atlas`가 768×2048 atlas와 상태별 timing manifest를 만든다. GIF는 육안 검토용이다. 일회성 동작의 반복 정책은 런타임 JSON이 소유한다.

`slice-sheet`가 환경 4×4 / 효과 4×3 / 재질 3×1을 분리한다. 환경·효과의 alpha floor는 64. 재질은 256px로 fit한 뒤 `background-tile`의 x/y period 192, overlap 32로 이어 붙인다. 마지막 `web/scripts/build-sprite-assets.mjs`가 앵커·팔레트·공용 sheet·해시 파일과 크레딧을 만든다.

최종 런타임 파일은 `web/public/sprites/`의 22 PNG, 약 9.18 MB다. `manifest.json`과 JS manifest는 동일 데이터다. 앱이 쓰는 원본만 복사하고 이전 해시의 빌더 소유 PNG만 정리한다. 생성 도구 LICENSE와 NOTICE를 함께 제공한다.

**팔레트 처리의 경계:** sprite-gen의 공식 `recolor`는 구아슈의 수만 가지 RGB를 한 색씩 전체 이미지에서 검색해 매우 느렸다. 공식 recolor spec과 같은 명시적 exact RGB map을 앱 어댑터가 한 번 순회해 적용한다. 이것은 앱 소유 단계이며 공식 recolor 실행 결과라고 표기하지 않는다. alpha는 유지한다. 환경 다크 변환도 빌드 시 수행한다.

## 생성 지침

이 절은 보존한 제작 지침/재생성 recipe이며 개별 도구 호출의 원문 transcript는 아니다. 상태별 action·프레임 수·fps는 `art/sprites/camper-request.json`이 기준이다. prepare가 출력하는 `prompts/<state>.txt`의 frame spacing과 safe padding 규칙을 사용하고, 배경 지시를 실제 투명 alpha로 바꿨다.

> Warm soft hand-painted gouache, smooth illustration rather than pixel art. Cream circular blank avatar head, terracotta pear-shaped torso, cream mitten hands, dark brown boots, warm brown outlines. Same character identity and proportions across every frame. Isolated on genuine transparent background; no face, text, floor, cast shadow or detached decoration. A horizontal strip with the exact requested frame count and generous separation. Keep feet at the same baseline and the full silhouette inside each slot.

들기 strip은 두 손을 머리 **위로** 올려 투명 배경으로 다시 생성했다. 최종 `camper-carry.png`만 재생성 입력에 포함한다. 환경은 나무·텐트·벤치·랜턴·라디오·표지판·울타리·쉼터·상자·트램펄린·공·포탈·부스·장작·꽃·바위 순이다. 효과는 amber/gold/blue/jade/violet 불꽃, 장난감 총/눈뭉치/폭탄, 충격/먼지/하트/불티 순이다. 지형은 grass/sand/stone 재질이다.

## 게임 합성 계약

`camp-sprite-animation.mjs`가 상태를 결정한다. idle 4, walk/run 각 6, sit/crouch 각 2, jump 4, carry/carried 각 4, 감정 6종 각 4, weapon 4, hit 3프레임이다. jump/weapon/hit은 일회성이고 나머지는 반복한다. 준비/상승/하강/착지와 피격은 게임 시각/물리 상태를 따른다. reduced-motion은 대표 프레임을 쓰되 공중과 착지의 의미는 보존한다.

사진은 매 프레임 감지한 머리 중심에 30.4px 원형 중앙 crop으로 합성한다. 머리 외곽 반경은 17px로 정규화한다. 사진은 몸의 facing에 따라 반전하지 않는다. 사진 위로 올라오는 손은 별도 crop을 다시 그린다. 들기·무기·감정 상체와 이동·앉기·웅크리기·공중 하체는 허리 clipping으로 조합한다. 생성 프레임 기반의 짧은 pose loop이며 보간 모델이나 골격 애니메이션은 아니다.

불꽃·먼지·충격·포탈은 생성한 정적 스프라이트에 크기·투명도·위치 변화를 적용한다. 별도 다중 프레임 효과 atlas로 표현하지 않는다. 지형은 맵/테마별 offscreen surface에 한 번 합성한다. 주변 꽃/바위는 `camp-scene-layout.mjs`의 비충돌 장식이며 실제 충돌은 `camp-maps.mjs`가 소유한다.

로더는 장면당 필요한 파일만 준비하고 decoded 이미지 캐시를 16개로 제한한다. 실패는 자동 반복 요청하지 않고 UI의 재시도로 해제한다. 사진·부스 이미지는 기존 별도 캐시/URL 검사를 사용한다. 테마 변경은 같은 Canvas와 게임 연결을 유지한다. 사용자 프로필의 여섯 톤 슬롯을 6개 컬러/6개 무채색 atlas로 표시하며 이전 사용자 색 값도 기존 슬롯 판정으로 매핑한다. 프로필 원본 값은 변경하지 않는다.

일러스트 실루엣과 연쇄 선택을 위해 들기 간격은 1.65(월드 투영 66px)다. 주변 충돌물 재배치와 함께 규약 v18로 구버전 물리와 구분한다. 포탈/부스/좌석 ID, 전송 필드, DB 스키마와 방·채팅·라디오 의미는 유지한다.

## 검사

`npm.cmd test`는 파일 해시/용량, 프레임 범위/alpha/손/발, 루프·일회성·혼합 자세·reduced-motion, 다크 alpha 보존, 로딩 실패·재시도·캐시 제한을 기존 게임 회귀와 함께 검사한다. `test:render`는 Canvas 직접 렌더, `test:browser:appearance`는 격리 headless Chromium의 실제 UI, `test:network`는 16인 loopback RTC다. 개인 브라우저나 데스크톱 UI를 조작하지 않는다.

초기 내부 용량 점검값은 전체 PNG 10 MB / 단일 장면 6 MB다. 사용자 목적이나 성능 보증치가 아니다. 측정·시각 확인 결과와 한계는 [검증 기록](validation.md)을 따른다.
