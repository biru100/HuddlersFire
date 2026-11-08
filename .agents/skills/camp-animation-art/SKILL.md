---
name: camp-animation-art
description: "HuddlersFire의 anchor 기반 개별 모션 원화 제작, CORE 합성, 원본 보존과 실행 전 검증에 적용한다. ChatGPT가 이 대화에서 제작과 기술 검증을 수행할 수 있으며 Codex 인계는 필수가 아니다."
---

# 현재 작업: NW core plan03

[현재 preflight](../../../docs/briefs/rounded-02/idle-core03-preflight.md), [실행 경계](../../../docs/briefs/rounded-02/PRE_EXECUTION_CHECKLIST.md), [실제 준비 원본](../../../art/sprites/source-registry/rounded02-idle-frames-nw-03/README.md)을 우선한다. plan01/02와 2×2 전체 시트 작업은 변경 없이 보존하는 이력이며 신규 기본 지시가 아니다.

## 책임

ChatGPT는 원화 생성·미술 검토뿐 아니라 연결 도구와 실행 환경이 허용하는 GitHub 수정, 픽셀 측정, 결정론적 합성·회귀 검증도 이 대화에서 수행한다. Codex는 선택적 개발 환경이지 필수 왕복 단계가 아니다. 실제 사용자 모션 선택, native/runtime 검증, 게임 실행·배포는 각각 별개다.

## 고정된 입력과 제작 순서

1. f1은 승인된 NW 원본 바이트 그대로다. SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`, 521850 bytes, 1086×1448 RGBA. 승인 디자인을 새로운 모션 승인으로 확대하지 않는다.
2. 실제 편집 입력으로 이 f1 PNG를 제공한다. 이전 실패 후보, 비교판, 스크린샷, 2×2 시트 또는 파일명만으로 입력을 대신하지 않는다. f2 들숨 한 장부터 검사하며 f2가 유효하기 전에 f3/f4를 양산하지 않는다.
3. f2/f3/f4는 각각 같은 f1에서 출발한다. 이전 생성 결과를 다음 프레임의 새 기준으로 삼지 않는다. 생성 요청과 실제 출력의 파일명·해시·크기·캔버스를 구분해 기록한다.
4. 출력 캔버스 불일치, 다른 인물/옷/방향, 부적절한 영역·이음새를 발견하면 원본을 보존하고 실패로 기록한다. resize/crop/alpha 변환/색 양자화/반전/코드 재작화로 통과시키지 않는다.

## plan03의 합성 계약

사전에 고정한 허용 영역을 4-neighbour erosion 4회로 줄인 CORE에서만 생성본 RGBA를 선택한다. 경계 띠와 그 밖의 모든 픽셀은 f1 RGBA 그대로 유지한다. `guardSource: anchor`가 명시된 새 플랜에만 적용한다. plan02의 원본 경계 완전 일치 규칙은 기존 작업에만 그대로 남는다.

- CORE SHA256: `278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d`.
- 머리·얼굴·하체·신발·손·소매 외곽은 고정한다. 후드·등 내부의 작은 의도적 변화만 사용한다.
- 생성 원본은 `generated/`, 합성 파생물은 `composites/`로 분리한다. 제외된 원본 변화와 합성에서 유지된 영역을 모두 보고한다.
- 경계 내부 gradient, 변경 비율과 RGBA 오차 예산은 유지한다. 마스크를 결과에 맞춰 넓히거나 failure를 숨기지 않는다.
- 한 프레임 기술 통과는 호흡/4→1 루프/사용자 모션 승인이 아니다. 실제 f1~f4가 모두 있고 검사된 뒤 마지막에 참고 시트를 무손실 배치한다. 누락 프레임을 f1 복제나 fixture로 채우지 않는다.

## 실험·증거·보존

원본 PNG는 GitHub 원본 레지스트리와 고정 커밋·SHA256으로 관리한다. 실제 바이너리 업로드·원격 재검증이 불가능하면 미완료로 기록하고 생성 원본을 대화에 그대로 제공한다. ZIP이나 미리보기로 원본을 대체하지 않는다.

`npm run test:idle-frames`, 관련 art/motion/pipeline 회귀와 typecheck/build는 기술 검증이다. 원격 CI의 실행 결과와 현재 대화에서 직접 실행한 검사를 구분한다. 이전 PASS를 새 실행으로 보고하지 않는다. 실제 편집 입력/원본 보존/실패 기록은 [후속 로컬 검사](../../../docs/reviews/2026-11-08-idle-core03-local-audit.md)를 함께 확인한다.

이번 작업의 금지 경계: main 병합, 애플리케이션 시작, 게임 자산 교체, production 설정·DB migration, 공개 배포. 모든 모션은 사용자 선택 전 `decision: pending`, `artApproved: false`, `animationApproved: false`, `productionReady: false`, `runtimeVerified: false`를 유지한다.
