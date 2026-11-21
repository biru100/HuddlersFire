---
name: camp-art-direction
description: "HuddlersFire 원화와 키포즈 제작, 아트 후보 비교, 실제 장면 검토와 사용자 미술 선택에 사용한다."
---

# 캠프 원화 제작과 미술 선택

## 현행 캠퍼 재생성

Codex의 내장 이미지 생성 도구로 현재 세션에서 기준 원화·키포즈·레이어 후보를 제작한다. [캠퍼 제작 규격](../../../art/sprites/field-camper-v2/README.md)과 작업 브리프에서 네 방향, 같은 얼굴·접점, 색과 화면 크기를 가져온다. 첫 서기 후보를 실제 크기로 검토한 뒤 후속 동작을 제작하며, 자세와 레이어 납품은 [camp-animation-art](../camp-animation-art/SKILL.md)와 [camp-sprite-assets](../camp-sprite-assets/SKILL.md)를 따른다.

원본 PNG 바이트와 SHA-256, 실제 요청문, 도구, 참조 이미지 여부를 보존한다. 표시되지 않은 모델 이름은 미확인으로 기록한다. 큰 생성 시트는 원화 후보로 보관한다. 네이티브 픽셀은 편집한 파생본으로 등록하고 그리드·알파·접점·장면을 검증한다. 최종 미술 선택과 런타임 채택은 사용자가 확인한다. 추가 비용이 발생하는 API는 별도 승인 범위다.

현재 게임의 캠퍼에 나무 의자·울타리·차양 등 환경을 맞추는 요청은 [현행 장면 전후 검토](../../../docs/art/scene-first-review.md)를 따른다. 수정 전후의 같은 플레이 장면을 먼저 확보하고, 표시 배율·원화의 선·목재 부재·이음새·접지 및 가림을 구분해 관찰한다. 신규 텍스트 원화는 아래 클린룸 경로, 과거 제출의 재현은 해당 시점의 영수증 경로를 사용한다.

> **LATEST SCOPED OVERRIDE · 2026-11-18:** If the task requests a NEW HuddlersFire visual language or clean-room pixel art, start from [camp-pixel-cleanroom](../camp-pixel-cleanroom/SKILL.md), [pipeline](../../../docs/art/pixel-ai-pipeline-v3.md), and the positive-only text brief. **DO NOT read or supply any previous PNG, Rounded 02 reference, old screenshots, derived palettes, image records or prior generated candidates as creative/model inputs.** The historical prerequisites below apply only to explicitly continuing that separate old-art revision, not to the clean-room project. Current user permits Work/Codex to author derived/native pixels in authorized scope, with user final art approval. No external paid model without specific authorization.

## Rounded 02 보존된 제작 절차

Rounded 02를 명시적으로 이어갈 때 아래 원본과 [GitHub-first 레지스트리](../../../art/sprites/source-registry/README.md)를 사용한다. 원격 등록을 요청받으면 실제 파일과 해시를 대조한다.

[활성 시각 제작](../../../docs/visual-production.md), [정책](../../../art/sprites/art-direction.json), [Rounded 02 현재 브리프](../../../docs/briefs/nw-se-rounded-lookdev-02.md)를 먼저 읽는다. 일반 기능 수정에는 이 절차를 추가하지 않는다.

현재 [Rounded 02 전달 환경](../../../docs/briefs/rounded-02/README.md)은 원본 미수신 상태다. 첨부 ZIP의 과거 시안·비교판을 독립 원화로 승격하거나 새 ChatGPT 미술 평가가 있는 것처럼 기록하지 않는다.

1. **ChatGPT가 아트 디렉터**다. 실제 이미지에 근거한 silhouette / direction / pixel-language / palette / character-appeal / scene-fit 관찰과 수정 후보를 ChatGPT 제작 대화에서 정한다. Codex는 자기 미술 점수나 인위적인 PASS로 이를 대체하지 않는다.
2. 첫 Rounded 01은 승인된 기준이 아니다. 새 후보는 같은 사람과 복장·색·idle을 고정하고 머리/몸통 균형, 발의 일관된 회전, 작은 화면 가독성을 개선한다. 기본 후보는 Rounded 02 A이며 B의 가방은 기본형 비교에 넣지 않는다.
3. `node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --view nw --out lookdev-nw-rounded-02`와 별도 `--view se --out lookdev-se-rounded-02`로 **각 방향 단독 PNG**를 요청한다. 비교판/라벨/배경/여러 캐릭터를 독립된 제작 원본처럼 수신하지 않는다.
4. ChatGPT에서 생성한 원본 다운로드 파일을 코드 처리 없이 Codex로 전달한다. 요청 모델명은 실제 호출 모델의 증명이 아니다. 원본 SHA256/출처를 기록하고 재수신 시 덮어쓰지 않는다. 원본이 없다면 생성 또는 수신 성공을 주장하지 않는다.
5. Codex는 PNG 디코딩·바이트·투명도·크기·앵커·작은 CSS 표시를 검사하며, 실제 게임 캡처를 ChatGPT에 다시 보내 주야간·가림·접지 등 미술적 평가를 요청한다. HTML 작은 표시는 실제 게임 장면이 아니다.
6. ChatGPT의 미술 평가 내용을 실제 대화 참조와 함께 `artDirectorReview: {actor: "chatgpt", reference: "...", summary: "..."}`에 기록한다. 여섯 기준의 구체적 관찰은 실제 그림을 보고 작성한다. 사용자의 **개별 원본 선택 발언/출처**만 `userDecision`에 기록한다. 모든 후속 구현을 승인했다는 말은 이미지 최종 승인으로 확장하지 않는다.
7. NW·SE가 모두 사용자 승인된 뒤에만 `--stage native-base --previous-job ... --previous-review ... --companion-job ... --companion-review ...`을 호출한다. 후속 스프라이트 조립은 **camp-sprite-assets**에 넘긴다.
8. 세 번의 디자인 수정을 해도 매력이 없으면 같은 프롬프트 반복 대신 제약/해상도/제작 방식의 원인을 제시한다. 원화와 기술 증거, 사용자 선택, 게임 배포의 상태를 따로 보고한다.

보존된 Rounded 02 원본의 출처와 승인 기록을 따른다. 원본 PNG는 새 파생본과 별도로 보존한다.
