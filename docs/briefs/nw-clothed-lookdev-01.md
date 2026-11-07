# 첫 NW 착의 캐릭터 · 외부 제작 요청과 수신

> **이력 문서:** 이 내용은 commit 2581601 당시 Rounded 01의 요청/수신 절차다. 현재 활성 하네스는 [Rounded 02 NW/SE 개선 브리프](nw-se-rounded-lookdev-02.md)이며 구 프롬프트는 새 job의 활성 요청문이 아니다. 첫 그림과 후속 비교 시트는 미술 미승인 상태다.

상태: **요청서 준비 / 원본 미수신 / 미술 미승인 / 실제 장면 미검증**. 요청 경로는 사용자 지정 **ChatGPT GPT Image 2.6**이며 실제 호출 모델은 결과의 관찰 가능한 증거가 있을 때만 확인한다. Codex는 이번 작업에서 캐릭터 이미지를 생성하지 않는다.

## 먼저 보낼 것

[최종 rounded 이미지 프롬프트](nw-clothed-lookdev-01.txt)의 전체 내용을 ChatGPT 이미지 제작 대화에 붙여 넣는다. 기존 미승인 NW 신체나 6색 가공본은 첨부하지 않는다. 이번 요청은 **착의 캐릭터 한 명, NW 뒷사선, 정지 자세 한 컷**이다. 후보 선택 뒤 기본 신체를 별도로 제작하며 옷에 가려진 신체를 추출했다고 주장하지 않는다.

첫 후보는 둥글고 귀여운 실루엣이라는 사용자 요구에 맞춘 rounded다. 승인된 스타일은 아직 없다. 비교 후보를 요청할 때는 같은 인물과 색·방향·자세·조명을 유지하고 아래 강조점만 바꾼다.

| 후보 | 조정할 것 | 판단할 관찰 |
| --- | --- | --- |
| compact | 짧고 다부진 비율, 붙는 소매, 짧고 구분되는 다리, 단단한 신발 | 작게 보아도 몸과 발이 읽히는가. 지나치게 뭉치거나 머리만 남지 않는가 |
| rounded | 완만한 어깨, 여유 있는 후드, 통통한 손과 둥근 신발 | 포근하고 귀여운가. 부피가 커져도 두 다리와 소매가 분리되는가 |
| graphic | 중립 체형, 큰 색면, 소수의 곱슬 묶음과 주름 | 명료하고 기억하기 쉬운가. 평평한 표지 기호처럼 굳지 않는가 |

셋은 양립 가능한 특징이지만 비교에서는 한 강조점만 바꾼다. 세 후보를 한 장의 비교 시트로 만들지 않는다. 첫 그림의 약점을 보고 필요한 다음 후보를 정한다.

## 준비된 작업

프로젝트 루트에서 다음 명령으로 동일 요청서를 재현할 수 있다. 이미 있는 이름을 덮어쓰지 않는다.

```powershell
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --out lookdev-nw-rounded-01
```

이번에 비교용으로 준비한 `lookdev-nw-compact-01`, `lookdev-nw-graphic-01`도 각각 독립된 요청서만 있으며 원화는 없다. 실행별 작업은 기존 정책에 따라 Git 제외인 `art/sprites/runs/`에 둔다. 최종 rounded 요청문과 이 안내는 저장소에 보존한다.

## 생성 결과를 Codex에 전달하는 방법

1. ChatGPT 이미지의 다운로드 기능으로 **원본 PNG 파일**을 저장한다. 화면 캡처나 브라우저의 축소 미리보기를 저장하지 않는다. 다운로드 형식이 PNG가 아니면 변환하지 말고 실제 파일과 형식을 알려 준다.
2. 이 Codex/AgentHub 대화에 원본 파일을 첨부하고 다음 문장을 보낸다. 첨부를 지원하지 않으면 다운로드한 파일의 전체 로컬 경로를 알려 준다. 파일을 프로젝트 `outputs/`에 복사해 경로를 알려 줘도 된다.

   > `lookdev-nw-rounded-01 결과입니다. 원본 보존 후 기술 검사와 시각 검토만 진행해 주세요. ChatGPT 대화 링크: (있으면 기재). 모델 표시/메타데이터: (관찰한 사실만 기재, 없으면 확인 불가).`

3. PNG 제출 자체는 미술 승인으로 기록하지 않는다. Codex는 원본명과 SHA256을 기록하고 같은 파일을 덮어쓰지 않는다. 수정본은 새 job으로 받는다.

Codex의 실제 수신 명령은 다음과 같다. `--source`는 실제 다운로드 경로로 바꾼다.

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-nw-rounded-01/job.json --source "C:\Downloads\original.png" --source-reference "ChatGPT 대화 링크 또는 전달 출처"
node web/tests/render-scene-preview.mjs --job art/sprites/runs/lookdev-nw-rounded-01/job.json
```

생성되는 `source/candidate.png`는 다운로드 원본과 같은 바이트다. `submission.json`에는 원본 SHA256·실제 출처·확인 불가 모델 상태를, `build/art-intake.json`에는 PNG 디코딩 결과를 보존한다. `art-review.html`은 더블클릭으로 로컬에서 볼 수 있는 정적 페이지이며 서버·외부 전송이 필요 없다. 재검사는 `--source` 없이 rebuild를 실행한다.

## 검토와 다음 단계

원본 100%와 밝고 어두운 바탕, 작은 표시 가설을 비교해 실루엣·NW 회전·픽셀 색면·팔레트·캐릭터 매력·캠프에 맞는 디자인을 구체적으로 기록한다. CSS의 작은 표시는 고해상도 원본의 형태 판단 보조이며 **64×96 네이티브 납품이나 실제 게임 합성의 증거가 아니다**. 새 원화가 없으므로 지금 품질 점수나 승인 관찰을 만들지 않는다.

매력적인 후보를 사용자가 선택하면 정확한 원본 해시와 선택 발언을 남긴 뒤 승인 시안을 참조한 NW 기본 신체 한 컷으로 넘어간다. 이후 같은 NW idle의 base + hair 1종 + top 1종 + bottom 1종, 실제 캠프 한 구역의 주야간·접지·가림·좌석 순으로 검증한다. 원본 크기를 지원하지 못하면 `blocked_native_delivery`를 보존하고 강제 축소·양자화로 해결했다고 쓰지 않는다.

공통 정책과 상세 명령은 [시각 제작](../visual-production.md), 이번 실행 근거는 [후속 검증 기록](../reviews/2026-11-07-first-lookdev-validation.md)을 따른다.
