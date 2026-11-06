---
name: camp-sprite-assets
description: "HuddlersFire의 수신 이미지·픽셀 레이어·아틀라스·장면 합성을 검증하거나 승인된 자산을 연결할 때 사용한다. 신규 원화는 ChatGPT 외부 제작 경로로 요청하며 Codex 내장 생성으로 대체하지 않는다."
---

# 캠프 원화 수신과 스프라이트 조립

## 활성 경로

[시각 제작](../../../docs/visual-production.md)과 `scene-spec.json.pixelQuarterview`를 먼저 읽는다. 새 미술 기준이 없거나 결과가 기각됐다면 **camp-art-direction**을 먼저 적용한다. 과거 시트의 따뜻한 색감만으로 이를 승인 원화로 간주하지 않는다.

1. `--art` 작업은 단일 착의 시안 또는 승인 시안에서 파생한 NW 기본 신체다. 원본 PNG와 실제 출처만 수신한다. 원본을 덮어쓰거나 첨부 패키지의 스크립트를 실행하지 않는다.
2. `prepare-sprite-job --art` → `rebuild-sprites --job` → `render-scene-preview --job` → `review-sprite-job --job --review`를 사용한다. 호출 경로는 문서의 실행 예를 따른다. 결과가 `blocked`이면 자동 수정으로 통과시키지 않는다.
3. 실제 64×96, alpha 0/255, 의도적인 픽셀 색면, 방향과 손발이 모두 확인돼야 네이티브 원화다. 알파/크기 PASS만으로 머리 중심이나 NW 시점이 검증됐다고 쓰지 않는다. 좌우 반전, 비율 늘이기, 강제 축소, 6색 변환, 코드 도형 재작화는 금지다.
4. 선택된 원화가 준비된 다음 기존 [제작 경로](../../../docs/sprite-authoring.md)의 catalog/`--pixel` 조립을 사용한다. 현재 캔버스·앵커는 제안이며 승인 기록과 구분한다. 먼저 base + hair 1종 + top 1종 + bottom 1종의 같은 NW idle 조합을 검토한다. 머리 2종/상의 2종 등은 이 조합 뒤에 추가한다.
5. 누락 방향·자세·프레임을 채우지 않는다. 공통 캔버스·시간·프레임별 앵커·피부/머리/옷 마스크·앞뒤 손 가림을 확인한다. 미승인 조합은 개발 프리뷰에서만 표시하고 부족한 경우 기존 캐릭터 전체를 유지한다.
6. 기존 pixel review CLI에는 미술 선택의 job/review와 최종 파일 해시, 실제 사용자 조립 승인 기록이 추가로 필요하다. 미술 승인만으로 실제 Canvas/UI/WebGL evidence를 생략하지 않는다. 승인 JSON은 사람 신원 인증 수단이 아니며 에이전트가 발언을 만들어 넣어서는 안 된다.
7. 조명·좌석·가림은 [장면 기준](../../../docs/scene-composition.md)과 [조명 계약](../../../docs/lighting.md)을 사용한다. 원본의 피부색과 밤 조명 문제를 분리한다. 사진·이름·입력·채팅·라디오·놀이·전시·온라인 데이터는 보존한다.
8. `npm run test:art-direction`, 관련 `test:sprites:pipeline`과 typecheck/build, 실제 렌더를 변경 범위대로 실행한다. 단위 테스트, 배경 대비 HTML, 실제 게임 렌더를 별도로 보고한다.

## 기존 일러스트 재현만 해당

고정 sprite-gen, `tools/sprite-gen.lock.json`, Lanczos 기반 추출·재패킹은 **기존 공개 원화 재현용**이다. [기존 제작 문서](../../../docs/sprite-authoring.md)를 해당 범위만 읽는다. 이를 신규 픽셀 제작의 기본 경로로 사용하지 않는다. upstream을 임의 수정하거나 전역 스킬·설정을 바꾸지 않는다.

기각된 normalization 실험의 재현은 명시적으로 요청됐을 때만 `--replay-rejected-experiment`와 기존 recipe를 사용한다. 플래그는 사용자 허가를 대신하지 않는다. 재현 성공은 미술 승인이나 새 작업의 기준이 아니다.

## 소유권

- `art/sprites/art-direction.json`: 생성 경로와 미술 판단 정책. 투영·픽셀 치수는 복제하지 않는다.
- `tools/lib/art-direction.mjs`: 외부 요청·출처·승인 계보. 이미지 생성/리사이즈/설치 기능 없음.
- `tools/lib/pixel-assets.mjs`: 기존 catalog·검사·개발 합성. 옛 기본 신체 요청 출력은 이력이며 활성 `--art` 요청을 대신하지 않음.
- `camp-avatar-assembly.mjs`: 같은 방향/상태의 레이어 정합성. 미술 판단은 하지 않음.
- 실제 런타임과 네트워크 계약은 [구조 문서](../../../docs/architecture.md)를 유지한다. 승인·실제 검증 전 설치/배포하지 않는다.
