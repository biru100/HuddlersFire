---
name: camp-animation-art
description: "HuddlersFire 캐릭터 Idle/Walk/Sit 등 모션 원화를 ChatGPT가 생성·미술 평가하고, Codex는 원본 보존·프레임 기술 검사·게임 합성만 수행할 때 사용한다."
---

# ChatGPT 애니메이션 원화와 Codex 모션 인계

**최신 원본 전달:** [GitHub-first 레지스트리](../../../art/sprites/source-registry/README.md). ChatGPT 제작 모션/레이어 PNG는 직접 GitHub 바이너리 업로드와 원격 해시 검증이 가능하면 그렇게 처리한다. 불가능하면 Codex가 실제 원본 PNG를 안전하게 Git에 등록한다. ZIP을 재생성하거나 기본으로 요구하지 않는다. 이미지 수정본은 새 파일과 새 해시로 등록한다.

[활성 시각 제작](../../../docs/visual-production.md), [Rounded 02 모션 인계](../../../docs/briefs/rounded-02/animation-idle-handoff.md), [캐릭터 디자인 승인](../../../docs/reviews/2026-11-07-rounded02-rev2-art-approval.md)을 먼저 읽는다. 게임 로직이나 단순 기능 수정에는 이 스킬을 호출하지 않는다.

1. **ChatGPT가 원화 제작자 겸 미술 디렉터**다. 방향별 Idle/Walk/Sit 동작과 후속 헤어·옷 레이어의 각 프레임 *이미지*는 ChatGPT 이미지 제작 경로에서 만들고 미술 평가·반복 수정도 여기서 한다. Codex는 대체 이미지를 생성·코드로 그리거나 도형 재작화하지 않는다.
2. ChatGPT에서 만든 4컷 시트라도 실제 승인된 `64×96` 프레임, 스프라이트 아틀라스, 게임 애니메이션으로 간주하지 않는다. 우선 `motion-lookdev`의 **참고용 원본**으로 받고 2×2 셀/프레임 순서(좌상→우상→좌하→우하)를 확인한다.
3. 예시: 승인된 부모 `lookdev`의 NW/SE를 각각 `node tools/motion-lookdev.mjs prepare --view nw|se --out <fresh-name> --parent-job <approved-job> --parent-review <approved-review>`로 연결한다. 부모 원본/승인 근거가 없으면 모션 작업을 생성하지 않고 보존 가능한 자료만 남긴다. 필요한 경로는 README를 따른다.
4. 신규 모션 PNG 원본 1장씩 `intake --job <job.json> --source <actual-png> --source-reference <actual-conversation>`로 바이트 보존 수신한 뒤 `inspect --job <job.json>`으로 검사한다. 해시·alpha·2×2 셀 크기/프레임 정렬/동일 인물 여부·접지·4→1 루프 이음새를 검토한다. 원본을 덮어쓰지 않는다.
5. `inspect`는 기존 `motion-review.html`과 함께 `build/motion-analysis.json/html`을 만든다. bbox·알파 히스토그램·발 하단/몸 중심 proxy·전환별 원시/정합 후 픽셀 차이·4→1을 측정하고, 재생·스크럽·명암 바탕·고스트·CSS 발중점 고정을 제공한다. 이 좌표는 의미 마커나 월드 접점의 자동 승인이 아니다. 컷을 별도 PNG로 재저장하거나 픽셀 수를 바꾸지 않는다. 같은 job의 실제 검토 기록을 덮어쓰지 않으며 수정본은 새 job이다. 정렬·동일 인물·미술적 루프는 `frameCellsVerified:false`, `loopVerified:false`, `productionReady:false`로 유지하고 ChatGPT가 판정한다. [Rounded 02 실제 검토 묶음](../../../docs/reviews/rounded02-idle-v1-20261108/README.md)에 검증된 부모 계보·복원 경로·Idle v2 요청서가 있다.
6. ChatGPT가 결과 화면과 검사 보고서를 보고 캐릭터 정체성·움직임의 자연스러움·얼굴/헤어·후드/바지·실루엣·색감·루프의 미술적 완성도를 판단하고 수정 원화를 새 작업으로 생성한다. **사용자의 실제 모션 후보 선택**은 캐릭터 기준작 승인과 다르다.

발점 자동 추정이 붙은 윤곽에서 잘못된 신발 영역을 잡으면 원본 마커를 대조하고 `inspect --foot-split <셀 내부 x열>`로 측정 영역을 명시할 수 있다. 값과 추정/지정 방식을 JSON·HTML에 공개하며, 이것을 원화 위치 보정·월드 접점 승인으로 취급하지 않는다. 새 모션은 registry version 2로 한 방향씩 수신할 수 있고 미수신 방향을 v1로 채우지 않는다. [NW Idle v2 수신 예](../../../docs/reviews/rounded02-idle-v2-nw-20261108/README.md)를 참고한다.
7. 모션 시안이 승인되어도 실제 64×96 프레임 격자·알파·앵커·방향·동작별 레이어 일치·네이티브 캔버스는 별도 검증해야 한다. 기존 `art-direction.mjs`의 디자인 승인 게이트 및 pixel catalog를 우회하거나 이 시트를 production-ready로 승격하지 않는다.
8. 테스트는 `cd web; npm.cmd run test:motion-lookdev` 및 변경 범위의 `npm.cmd test`, `test:sprites:pipeline`, typecheck/build를 기존 규칙대로 실행한다. 미실행은 미실행으로 보고한다. 원본 이미지 제작/검토와 실제 게임 적용·배포 상태를 구분한다.

프로젝트 밖의 전역 스킬·Codex 설정은 수정하지 않는다. 화면 캡처/압축 미리보기를 원본으로 받지 않는다.
