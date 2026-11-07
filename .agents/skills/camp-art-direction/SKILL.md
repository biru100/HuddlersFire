---
name: camp-art-direction
description: "HuddlersFire 시각 퀄리티 개선 시 ChatGPT에서 원화·미술 판단을 수행하고 Codex에서 검사 증거·요청서를 관리하도록 분담한다."
---

# ChatGPT 아트 디렉션 · 원화 선택

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

Codex 내장 imagegen이나 유료 API·자동 리사이즈·좌우 반전·코드로 재작화하여 원본을 대체하지 않는다. 요청 기능이 없으면 요청서만 제공한다. 전역 에이전트 설정·공통 스킬을 수정하지 않는다.
