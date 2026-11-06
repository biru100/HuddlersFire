---
name: camp-sprite-assets
description: HuddlersFire의 일러스트 캐릭터·환경·효과 스프라이트를 생성, 교체하거나 아틀라스를 재구성할 때 고정된 sprite-gen 도구와 실제 장면의 합성·구성 기준을 적용한다.
---

# 캠프 스프라이트 제작

INT-24의 신규 목표는 픽셀 쿼터뷰다. 기존 구아슈 원화/정식 manifest는 롤백 경로로 보존한다. 픽셀 패키지는 [기존 제작 경로의 픽셀 절](../../../docs/sprite-authoring.md)을 따라 `prepare-sprite-job.mjs --pixel` → 기존 `rebuild-sprites.mjs --job` → `render-scene-preview.mjs --job` → `review-sprite-job.mjs --job`로 검사한다. 원본은 새 incoming 폴더에 보존하며 덮어쓰지 않는다. 신규 수신 컷아웃의 무손실 검사/복사와 고정 sprite-gen의 추출/아틀라스 재패킹을 구분한다. 픽셀에 아래 일러스트용 Lanczos/비율 추정을 적용하지 않는다. 누락 방향/프레임/레이어는 생성 요청서로 기록하며 자동 반전/늘이기/블러로 채우지 않는다. 미승인 후보는 개발 플래그 안에서만 표시한다.

## 적용 범위

새 bitmap 캐릭터·동작·지형·시설·효과를 만들거나 기존 원본을 교체할 때 사용한다. UI 문구나 게임 규칙만 바뀌면 적용하지 않는다. 계획만 요청되면 자료만 읽고 파일·생성 도구를 실행하지 않는다. 프로젝트 밖의 설정·스킬·도구를 변경하지 않는다.

현재 승인과 표현 기준은 [의도 기준](../../../docs/project-intent.md), 실제 제작 방법은 [자산 계약](../../../docs/sprite-assets.md), 상태 목록은 [요청 파일](../../../art/sprites/camper-request.json)을 읽는다. 기존 사용자 결정은 다시 묻지 않는다.

생성 전에 [장면 구성 기준](../../../docs/scene-composition.md)으로 바뀌는 자산과 사람·시설·바닥·UI의 관계를 정한다. 전면 교체는 대표 합성 장면을 먼저 확인한 뒤 전체로 확장한다. 단독 그림이나 contact sheet만 보고 장면의 조화를 완료 처리하지 않는다.

새 생성은 [제작 경로](../../../docs/sprite-authoring.md)를 읽고 `scene-spec.json` → `prepare-sprite-job.mjs`의 작업별 프롬프트/요청 → 선택 원본 → `rebuild-sprites.mjs --job` → 실제 renderer/전체 UI → 검토 순서로 진행한다. 원본은 먼저 격리 작업 폴더에 두고 생성 출처도 프로젝트 안에 보존한다. 모든 원본을 만들기 전에 부분 제작으로 확인한다. 전체 신규 생성 준비에는 같은 명세의 검토 완료 파일럿이 필요하며, 기존 원본의 전체 재패킹은 이 조건과 구분한다. 프롬프트·보정·원본이 달라지면 기존 검토를 재사용하지 않는다.

## 제작 순서

기존 색 원화에 노멀 등 수치 재질 채널만 추가하는 작업은 [조명 계약](../../../docs/lighting.md)과 제작 경로의 재질 절을 따른다. 고정 sprite-gen의 원화 추출과 구분하고, 색 원본·노멀·UV·반전·머리 제외 마스크를 같은 작업의 해시로 묶는다. 원화 밝기를 정답 높이로 취급하지 않는다. 실제 WebGL 대표 검토 후 전체 동작·UI·Canvas 폴백을 확인하며, 수치 채널 생성 성공이나 기존 Canvas 캡처를 노멀 조명 품질 통과로 보고하지 않는다.

1. `tools/sprite-gen.lock.json`과 원본·기존 자산을 확인한다. 도구가 없을 때만 프로젝트 루트의 `node tools/setup-sprite-gen.mjs`를 실행한다. 고정 커밋이 다르면 자동 reset하지 말고 차이를 확인한다.
2. 새 작업은 명세에서 생성한 프롬프트와 참조·프레임 수를 사용해 imagegen 스킬의 내장 도구로 만든다. 유료 API나 모델을 조용히 대체하지 않는다. Discord 사진과 공식 게임 이미지는 생성기에 보내지 않는다.
3. 신규 파일럿 원본은 작업 폴더의 `source/`에 두고, 채택 원본·생성 지침·출처를 프로젝트 안의 별도 경로에 보존한다. 정식 `art/sprites/source/` 교체는 현재 승인에 포함됐을 때만 한다. 동작은 상태별 strip, 시설·효과는 명시적인 grid로 만든다. 투명 배경은 실제 alpha를 요구하며 픽셀아트 변환은 사용하지 않는다.
4. 신규 작업은 `node tools/rebuild-sprites.mjs --job <작업>/job.json`으로 선택한 입력만 slice/tile/앱 어댑터에 연결한다. 기존 전체 원본 재패킹은 인자 없는 명령의 extract → compose-atlas/GIF → slice-sheet → background-tile 경로를 유지한다. 원본·외부 파일을 삭제하지 않으며 실패한 단계를 통과한 것으로 취급하지 않는다.
5. extract 오류/경고·프레임 수·잘림·손·머리 앵커·지면 기준선·타일 반복을 확인한다. 사진 머리는 원형, 중앙 crop, 좌우 반전 없음. 앞쪽 손은 사진 위에 합성한다. 상체와 하체 혼합 자세, 실제 시설과의 방향·접촉·가림을 합성 화면에서 확인한다.
6. `web/`의 `npm.cmd test`, `npm.cmd run test:render`, `npm.cmd run typecheck`, `npm.cmd run build`를 변경 범위에 맞게 실행한다. `test:render:metrics`는 로컬 CPU Canvas 비교이며 기기 FPS로 보고하지 않는다. 격리 headless 검사는 사용자 개인 UI 조작과 구분한다.
7. 새 동작의 전체 프레임/루프와 변경에 영향받는 테마·화면 폭·사진·연쇄 장면을 실제로 열어 검토하고 [검증 기록](../../../docs/validation.md)에 이미지 경로·관찰·한계를 남긴다. 기술 검사·시각 검토·미해결을 구분하며 추출이나 렌더 명령 통과만으로 자연스러운 동작·장면 조화가 검증됐다고 쓰지 않는다. 배포는 현재 요청의 승인 범위에 따로 포함될 때만 한다.

## 소유권

- 생성/추출/합성 도구: 고정 sprite-gen 원본. upstream 소스를 프로젝트 패치로 고치지 않는다.
- 앱 어댑터: `web/scripts/build-sprite-assets.mjs`. 머리·손·발 앵커, 정확 RGB lookup, 패킹, 다크 팔레트, 해시/크레딧.
- 현재 필드 v2 전체 명세는 `art/sprites/scene-spec.json`이다. v2 빌드/검토/설치는 `tools/lib/field-assets.mjs`와 제작 경로의 v2 절을 따르며 이전 manifest로 누락을 채우지 않는다. 머리 측정은 초안으로 취급하고 프레임별 앵커를 고정한 뒤 모든 프레임·혼합 자세·실제 장면을 검토한다. 작은 v1 파일럿은 `art/sprites/examples/`의 이력이다.
- 런타임: `camp-sprite-assets.mjs`, `camp-sprite-animation.mjs`, `camp-character.mjs`, `camp-artwork.mjs`. 생성기와 Python은 앱 번들에 넣지 않는다.
- 생성된 manifest 좌표와 해시 파일은 수작업 수정하지 않는다. 공유 물리·배치를 변경하면 규약·회귀·구조 문서까지 함께 검토한다.
