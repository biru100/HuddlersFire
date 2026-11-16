---
name: camp-animation-art
description: "HuddlersFire 캐릭터 Idle/Walk/Sit 등 모션 원화를 ChatGPT가 생성·미술 평가하고, Codex는 원본 보존·프레임 기술 검사·게임 합성만 수행할 때 사용한다."
---

# ChatGPT 애니메이션 원화와 Codex 모션 인계

> **2026-11-16 적용 범위 변경:** 이 스킬은 HuddlersFire 전체 하네스의 **하위 아트 작업**일 뿐이다. 최상위 의도는 [프로젝트 운영 하네스](../../../docs/harness/README.md)와 [의도 트리](../../../docs/harness/INTENT_TREE.md)를 먼저 본다. 사용자 결정에 따라 ChatGPT가 컨셉·키포즈를 만들고, Work/Codex가 **명시적으로 허가된 범위 내에서 파생 픽셀·레이어·모션을 직접 제작·편집·보정**할 수 있다. 이전의 Codex 미술 편집 전면 금지 규칙은 이 범위에서 대체된다. 사용자가 최종 미술을 승인하며 원본 PNG는 수정하지 않는다. NW Idle 및 CORE03는 전역 기준이 아니다.

**최신 원본 전달:** [GitHub-first 레지스트리](../../../art/sprites/source-registry/README.md). ChatGPT 제작 모션/레이어 PNG는 직접 GitHub 바이너리 업로드와 원격 해시 검증이 가능하면 그렇게 처리한다. 불가능하면 Codex가 실제 원본 PNG를 안전하게 Git에 등록한다. ZIP을 재생성하거나 기본으로 요구하지 않는다. 이미지 수정본은 새 파일과 새 해시로 등록한다.

[활성 시각 제작](../../../docs/visual-production.md), [Rounded 02 모션 인계](../../../docs/briefs/rounded-02/animation-idle-handoff.md), [캐릭터 디자인 승인](../../../docs/reviews/2026-11-07-rounded02-rev2-art-approval.md)을 먼저 읽는다. 게임 로직이나 단순 기능 수정에는 이 스킬을 호출하지 않는다.

1. **ChatGPT는 컨셉/키포즈·미술 평가를 담당하고, Work/Codex는 승인된 작업 범위에서 파생 네이티브 픽셀·레이어·중간 모션 프레임을 직접 제작·편집할 수 있다.** 실제 원본은 불변으로 보존하며, 미술 최종 승인은 사용자에게 있다. 특정 작업의 명시적 금지·미승인 원화 변경은 그대로 금지된다.
2. ChatGPT에서 만든 4컷 시트라도 실제 승인된 `64×96` 프레임, 스프라이트 아틀라스, 게임 애니메이션으로 간주하지 않는다. 우선 `motion-lookdev`의 **참고용 원본**으로 받고 2×2 셀/프레임 순서(좌상→우상→좌하→우하)를 확인한다.
3. 예시: 승인된 부모 `lookdev`의 NW/SE를 각각 `node tools/motion-lookdev.mjs prepare --view nw|se --out <fresh-name> --parent-job <approved-job> --parent-review <approved-review>`로 연결한다. 부모 원본/승인 근거가 없으면 모션 작업을 생성하지 않고 보존 가능한 자료만 남긴다. 필요한 경로는 README를 따른다.
4. 신규 모션 PNG 원본 1장씩 `intake --job <job.json> --source <actual-png> --source-reference <actual-conversation>`로 바이트 보존 수신한 뒤 `inspect --job <job.json>`으로 검사한다. 해시·alpha·2×2 셀 크기/프레임 정렬/동일 인물 여부·접지·4→1 루프 이음새를 검토한다. 원본을 덮어쓰지 않는다.
5. `motion-review.html`의 각 셀 표시는 CSS 크롭을 활용하는 **비파괴 미리보기**다. 컷을 별도 PNG로 재저장하거나 픽셀 수를 바꾸지 않는다. 기술적인 정렬·루프가 미검증이면 `frameCellsVerified:false`, `loopVerified:false`, `productionReady:false`로 보고한다.
6. ChatGPT가 결과 화면과 검사 보고서를 토대로 캐릭터 정체성·움직임·실루엣·색감·루프를 비평한다. 허가된 기술적/픽셀 보정은 Work/Codex가 수행할 수 있다. **사용자의 최종 미술 승인**은 기준 캐릭터·모션·게임 적용과 분리해 기록한다.
7. 모션 시안이 승인되어도 실제 64×96 프레임 격자·알파·앵커·방향·동작별 레이어 일치·네이티브 캔버스는 별도 검증해야 한다. 기존 `art-direction.mjs`의 디자인 승인 게이트 및 pixel catalog를 우회하거나 이 시트를 production-ready로 승격하지 않는다.
8. 테스트는 `cd web; npm.cmd run test:motion-lookdev` 및 변경 범위의 `npm.cmd test`, `test:sprites:pipeline`, typecheck/build를 기존 규칙대로 실행한다. 미실행은 미실행으로 보고한다. 원본 이미지 제작/검토와 실제 게임 적용·배포 상태를 구분한다.

프로젝트 밖의 전역 스킬·Codex 설정은 수정하지 않는다. 화면 캡처/압축 미리보기를 원본으로 받지 않는다.
