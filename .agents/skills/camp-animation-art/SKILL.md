---
name: camp-animation-art
description: "HuddlersFire 모션 원화의 ChatGPT 제작·미술 검토와 Codex의 원본·정렬·루프 검사를 분담한다. Rounded 02 Idle은 anchor 고정과 영역 잠금 후 프레임별 수신·마지막 조립을 사용한다."
---

# ChatGPT 애니메이션 원화와 Codex 모션 인계

원화 생성·수정·미술 평가는 ChatGPT, 원본 보존·기술 검사·조립·승인 후 게임 연동은 Codex, 실제 모션 최종 선택은 사용자다. 일반 게임 로직 수정에는 이 제작 절차를 추가하지 않는다.

먼저 [GitHub 원본 레지스트리](../../../art/sprites/source-registry/README.md), [현재 Idle 프레임 절차](../../../docs/briefs/rounded-02/idle-frame-workflow.md), [디자인 승인](../../../docs/reviews/2026-11-07-rounded02-rev2-art-approval.md)을 읽는다. Rounded 02 Rev2 NW/SE **디자인만** 승인됐고 Idle은 `pending-motion-review`다.

1. **기본 경로:** `tools/idle-frames.mjs prepare`로 실제 같은 방향 lookdev 부모·리뷰와 동일 SHA의 원본을 f1 neutral 후보로 연결한다. NW부터 적용하고 SE는 독립 anchor·부위 플랜이 필요하다. 없는 부모/원본을 만들거나 과거 2×2 시트에서 f1을 잘라 대체하지 않는다.
2. **기준 고정:** 두 신발 전체·발바닥/뒤꿈치/발끝·무릎 아래·전체 위치·카메라/원근/방향은 잠근다. 허용 다각형 밖은 전부 잠금이다. 작은 가슴/어깨/후드 위/등 위/일부 머리 끝/상완만 예산 안에서 움직인다. 초안 영역·neutral·예산·타이밍은 실제 ChatGPT 확인을 받은 뒤 `confirm-plan --reference <실제-출처>`로 기록한다. 최종 모션 승인이 아니다.
3. **각각 생성:** ChatGPT에 동일 f1 PNG, REGION_LOCKS.md/json, FRAME_INTENT.json과 해당 `f2-request.txt/json`을 첨부한다. f2 inhale, f3 exhale, f4 return을 하나씩 만든다. 각 프레임은 같은 f1에서 시작한다. f2→3의 독보적 급변이나 전신 상하 바운스를 허용하지 않는다. 모델의 원본 픽셀 보존 한계는 보고하고 자동 복원 합성으로 숨기지 않는다.
4. **원본 수신:** `intake --frame f2|f3|f4 --source <실제-PNG> --source-reference <실제-생성출처> --anchor-sha <f1-SHA>`로 바이트 그대로 등록한다. PNG/동일 캔버스/출처/플랜/해시를 검사한다. 수정본은 새 set이다. 관찰 못 한 모델은 null/unverified다. GitHub 실제 바이너리와 원격 SHA까지 검증하며 ZIP을 기본 인계로 만들지 않는다.
5. **검사:** `inspect`로 global translation, foot lock, locked region, motion budget, 네 전환 리듬과 4→1, morph summary를 본다. 위치 보정·확대축소·양자화·반전·알파 이진화·코드 재작화를 하지 않는다. 보고서와 원본 재생 HTML을 ChatGPT에 보내 호흡 가독성·인물/옷/방향의 미술 일관성을 평가받는다. 미수신 프레임을 f1 반복으로 채우지 않는다.
6. **마지막 조립:** 네 실제 원본과 확인된 플랜, 현재 기술 통과 후 `assemble`로 동일 크기 2×2 참고 시트에 무손실 배치한다. 원본 RGBA/반투명/숨은 RGB와 색 해석을 유지한다. `ASSEMBLY.json`은 파생물 증거다. 이 시트는 native 납품이나 모션 승인이 아니다. GIF 대신 원본 PNG를 사용하는 HTML 루프를 제공한다.
7. **승인 분리:** 디자인 승인·anchor/플랜 확인·모션 사용자 선택·native/pixel/runtime·배포를 구분한다. 이 하네스는 `artApproved:false`, `animationApproved:false`, `decision:pending`, `productionReady:false`, `runtimeVerified:false`를 유지한다. 실제 ChatGPT 평가/사용자 발언이 없으면 review 출처나 내용을 만들지 않는다. 별도 승인 전 게임 원화 교체·배포를 하지 않는다.

기존 전체 시트 작업은 [과거 브리프](../../../docs/briefs/rounded-02/animation-idle-handoff.md)와 `motion-lookdev.mjs`로 보존한다. 새 전체 시트 작업의 prepare는 **명시적 `--legacy-sheet`**가 있어야 한다. 과거 요청문·원본·리뷰·승인 fingerprint 및 `art-direction.mjs`/정책/native-base 조건은 바꾸지 않는다. 레거시 플래그는 신규 전체 시트 제작 승인이 아니다.

검증은 `web/`에서 `npm.cmd run test:idle-frames`, `test:motion-lookdev`, `test:art-source-registry`, `test:art-direction` 및 변경 범위의 전체/pipeline/typecheck/build를 실행한다. 미술 PASS나 실제 게임 루프 검증으로 해석하지 않는다. [NW 준비 폴더](../../../art/sprites/source-registry/rounded02-idle-frames-nw-01/README.md)에서 실제 상태와 입력 요청서를 확인한다. 프로젝트 밖 전역 설정·공통 스킬은 수정하지 않는다.
