---
name: camp-animation-art
description: "HuddlersFire 캐릭터 Idle·Walk·Sit 원화와 키포즈, 파생 픽셀·레이어 제작 및 실제 게임 검토에 사용한다."
---

# 캠프 애니메이션 원화와 모션 검토

## 현행 캠퍼 재생성

기준 서기 후보와 같은 세션에서 Codex 내장 이미지 생성 도구로 Idle·Walk·Sit 및 제스처 키를 만든다. 기준 얼굴·헤어, 네 방향, 64×80 기본 셀과 192×240 보행 몸통·다리, 목·발 접점을 [캠퍼 규격](../../../art/sprites/field-camper-v2/README.md)에서 가져온다. 원본 바이트·요청문·SHA-256을 보존한 뒤 작업 범위에서 네이티브 파츠와 프레임을 파생한다. 실제 로비와 필드에서 같은 인물인지, 접지·가림·보행 루프와 앉고 일어나는 접점이 자연스러운지 확인한다. 최종 미술 선택은 사용자에게 있다.

> **2026-11-18 new-design scope:** The new pixel-art pilot [clean-room pipeline](../../../docs/art/pixel-ai-pipeline-v3.md) precedes character animations. Do **not** automatically load old F1/F2, CORE03, Rounded 02 PNGs, old palettes or historical idle sprites as generation/conditioning inputs. Any older animation-specific source prerequisites below are historical and only apply if the user explicitly resumes that older experiment. Await user-selected NEW modular avatar, then prototype key poses for Idle/Carry/Throw separately with 1× visual approval. Retro Diffusion Animation walk/idle outputs 48×48 and cannot automatically replace 64×96 native art. Never claim generated frames are player-approved.

> **2026-11-16 적용 범위 변경:** 이 스킬은 HuddlersFire 전체 하네스의 **하위 아트 작업**일 뿐이다. 최상위 의도는 [프로젝트 운영 하네스](../../../docs/harness/README.md)와 [의도 트리](../../../docs/harness/INTENT_TREE.md)를 먼저 본다. 사용자 결정에 따라 ChatGPT가 컨셉·키포즈를 만들고, Work/Codex가 **명시적으로 허가된 범위 내에서 파생 픽셀·레이어·모션을 직접 제작·편집·보정**할 수 있다. 이전의 Codex 미술 편집 전면 금지 규칙은 이 범위에서 대체된다. 사용자가 최종 미술을 승인하며 원본 PNG는 수정하지 않는다. NW Idle 및 CORE03는 전역 기준이 아니다.

## Rounded 02 보존된 모션 절차

원격 원본 등록을 요청받으면 [GitHub-first 레지스트리](../../../art/sprites/source-registry/README.md)에서 실제 바이트와 해시를 대조한다. 이미지 수정본은 새 파일과 새 해시로 등록한다.

[활성 시각 제작](../../../docs/visual-production.md), [Rounded 02 모션 인계](../../../docs/briefs/rounded-02/animation-idle-handoff.md), [캐릭터 디자인 승인](../../../docs/reviews/2026-11-07-rounded02-rev2-art-approval.md)을 먼저 읽는다. 게임 로직이나 단순 기능 수정에는 이 스킬을 호출하지 않는다.

1. **ChatGPT는 컨셉/키포즈·미술 평가를 담당하고, Work/Codex는 승인된 작업 범위에서 파생 네이티브 픽셀·레이어·중간 모션 프레임을 직접 제작·편집할 수 있다.** 실제 원본은 불변으로 보존하며, 미술 최종 승인은 사용자에게 있다. 특정 작업의 명시적 금지·미승인 원화 변경은 그대로 금지된다.
2. ChatGPT에서 만든 4컷 시트라도 실제 승인된 `64×96` 프레임, 스프라이트 아틀라스, 게임 애니메이션으로 간주하지 않는다. 우선 `motion-lookdev`의 **참고용 원본**으로 받고 2×2 셀/프레임 순서(좌상→우상→좌하→우하)를 확인한다.
3. 예시: 승인된 부모 `lookdev`의 NW/SE를 각각 `node tools/motion-lookdev.mjs prepare --view nw|se --out <fresh-name> --parent-job <approved-job> --parent-review <approved-review>`로 연결한다. 부모 원본/승인 근거가 없으면 모션 작업을 생성하지 않고 보존 가능한 자료만 남긴다. 필요한 경로는 README를 따른다.
4. 신규 모션 PNG 원본 1장씩 `intake --job <job.json> --source <actual-png> --source-reference <actual-conversation>`로 바이트 보존 수신한 뒤 `inspect --job <job.json>`으로 검사한다. 해시·alpha·2×2 셀 크기/프레임 정렬/동일 인물 여부·접지·4→1 루프 이음새를 검토한다. 원본을 덮어쓰지 않는다.
5. `motion-review.html`의 각 셀 표시는 CSS 크롭을 활용하는 **비파괴 미리보기**다. 이 참고용 미리보기에서는 원본 컷을 별도 파일로 저장하지 않는다. 허가된 네이티브 제작 단계에서는 파생 파일과 해시를 별도로 기록한다. 기술적인 정렬·루프가 미검증이면 `frameCellsVerified:false`, `loopVerified:false`, `productionReady:false`로 보고한다.
6. ChatGPT가 결과 화면과 검사 보고서를 토대로 캐릭터 정체성·움직임·실루엣·색감·루프를 비평한다. 허가된 기술적/픽셀 보정은 Work/Codex가 수행할 수 있다. **사용자의 최종 미술 승인**은 기준 캐릭터·모션·게임 적용과 분리해 기록한다.
7. 모션 시안이 승인되어도 실제 64×96 프레임 격자·알파·앵커·방향·동작별 레이어 일치·네이티브 캔버스는 별도 검증해야 한다. 기존 `art-direction.mjs`의 디자인 승인 게이트 및 pixel catalog를 우회하거나 이 시트를 production-ready로 승격하지 않는다.
8. 테스트는 `cd web; npm.cmd run test:motion-lookdev` 및 변경 범위의 `npm.cmd test`, `test:sprites:pipeline`, typecheck/build를 기존 규칙대로 실행한다. 미실행은 미실행으로 보고한다. 원본 이미지 제작/검토와 실제 게임 적용·배포 상태를 구분한다.

프로젝트 밖의 전역 스킬·Codex 설정은 수정하지 않는다. 화면 캡처/압축 미리보기를 원본으로 받지 않는다.
