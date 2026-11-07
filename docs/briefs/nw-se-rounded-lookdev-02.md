# HuddlersFire Rounded 02 · NW/SE 디자인 개선 및 검토

> **후속 결정 (2026-11-07):** Rounded 02 **Rev2 NW·SE 두 원본**이 사용자에게 미술 기준작으로 선택됐다. [원본별 SHA256 및 미술 승인 기록](../reviews/2026-11-07-rounded02-rev2-art-approval.md)을 확인한다. 아래의 ‘미술 미승인’ 문구는 Rev2 제작 전 이력이다. 네이티브 규격·실제 게임 적용 승인은 아직 아니다.


상태 (2026-11-07): **워크플로 개편 승인 / 비교 디자인 이미지 생성 / NW·SE 단독 원본 미수신 / 미술 미승인 / native 미제작 / 게임 미적용**.

## 생성된 비교 결과와 실제 관찰

아래 미술 관찰은 기존 ChatGPT 제작 대화에서 정리해 PR #2에 남긴 이력이다. 이번 Codex 작업은 파일의 기술 검증만 수행하며 새로운 미술 평가·승인으로 대체하지 않는다.

- **Rounded 01 단독 NW**: 1086×1448 PNG, SHA256 `8e4169f1b96a31334ec2b2756f589fcb619717f885e9166c13c97ba006c9d650`. 곱슬머리 부피가 과하고 몸통·신발의 방향/비율이 애매해 미술 승인 보류.
- **Rounded 02 A/B 비교 시트**: 1536×1024 PNG, SHA256 `47b0b7b90e0b46505b8c8e7568d80f752ce8c32d20a516ed0437cf2c18f6378d`. 후보 A는 후드·바지·신발 실루엣이 간결해 우선 시도할 만하다. 후보 B는 가방이라는 변수를 추가해 기본형 검토에서 보류한다. NW와 SE가 표시돼 있지만 여러 캐릭터·라벨·배경이 있는 **참고용 시트**이며 게임용 원본 PNG가 아니다.
- **Rounded 02 추가 A/B 디자인 보드**: 1536×1024 PNG, SHA256 `d01d4c83655589ed305dee74f81bd683f12fdfbf5ef5129b5d9069d3f36c3455`. A는 정돈된 기본형, B는 좀 더 뚜렷한 곱슬머리로 개성을 강조했다. 그림 속 `64×96` 미리보기나 점수·추천 문구는 실제 파일 규격/사용자 승인/게임 적용의 증거가 아니다. 이 파일 역시 다중 인물·텍스트·배경이 있는 탐색 보드이므로 `--source`로 수신하면 안 된다. A/B 선택과 독립 PNG 납품은 아직 완료되지 않았다.
- 별도로 생성된 프로젝트 진행 인포그래픽은 캐릭터 원화도, 미술 점수/승인/배포의 증거도 아니다. 그림 안의 "승인 완료"라는 글귀는 어떤 승인 기록으로도 사용하지 않는다.
- 후속 사용자 ZIP을 수신해 과거 시안 1장·참고 보드 2장과 ZIP 원본을 [참고 자료 보존 폴더](../../art/sprites/incoming/lookdev-handoff-v2/README.md)에 바이트 그대로 보존하고 manifest의 해시·크기를 실제 디코딩 결과와 대조했다. **Rounded 02 NW·SE 독립 원본은 여전히 없다.** 생성 호출의 실제 모델 표기가 검증되지 않으면 `observedModel: null`로 둔다.

## 다음 두 장의 착의 단독 원화

**Rounded 02 A**를 개선 시작점으로 삼는다. 원본 Rounded 01보다 머리 부피를 절제하고, 몸통·후드·소매·양다리·신발의 구분을 강화한다. 밤갈색 짧은 곱슬머리, 세이지색 내려진 후드티, 차콜 브라운 긴 바지, 따뜻한 갈색 신발·짧고 통통한 팔다리·편안한 idle은 유지한다. 배낭·소품·텍스트·UI·비교판·배경·바닥 그림자는 제거한다. 가짜 도트, 흐린 경계, 디더, 강제 양자화 없이 픽셀 계단과 색면을 일관되게 한다.

- **NW:** 왼쪽 위를 보는 뒷사선. 뒤통수·등·내려진 후드가 보이고 얼굴/눈은 보이지 않는다. 어깨·골반·두 신발은 한 방향으로 회전한다.
- **SE:** 오른쪽 아래를 보는 앞사선. 자연스러운 앞머리·눈·상의 전면이 보이되 NW와 비율·색·의상 형태가 같다. 정측면/정면으로 바꾸지 않는다.
- 각 이미지 **한 명/한 방향/실제 투명 배경 PNG 원본**을 따로 생성한다. 사후 강제 축소 없이 원본 해상도를 유지한다. `LOOKDEV_ONLY`는 실제 64×96 납품이 아니다.

## Codex에서 두 독립 작업 준비

현재 두 job과 방향별 요청문·전달 맥락을 준비했다. 사용자는 [Rounded 02 작업 환경 및 필요한 파일](rounded-02/README.md)을 따른다. 이는 원화 수신·미술 승인·네이티브 제작 완료가 아니다.

```powershell
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --view nw --out lookdev-nw-rounded-02
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --view se --out lookdev-se-rounded-02
```

각 작업의 `CHATGPT_REQUEST.txt`를 별도로 ChatGPT에 전달한다. ChatGPT에서 생성한 **다운로드 원본 PNG**를 Codex 대화에 첨부하거나 실제 로컬 경로로 인계한 뒤, 서로 다른 job으로 수신한다.

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-nw-rounded-02/job.json --source "C:\Downloads\rounded-02-nw.png" --source-reference "실제 ChatGPT 대화 링크"
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-se-rounded-02/job.json --source "C:\Downloads\rounded-02-se.png" --source-reference "실제 ChatGPT 대화 링크"
```

기존 `lookdev-nw-rounded-01` 로컬 작업은 정책 해시/프롬프트가 갱신돼 새 시안의 활성 작업으로 재사용하지 않는다. 시트 그림이나 임시 캡처를 단독 PNG로 조작·재수신하지 않는다.

## 미술 검토와 승인 구분

1. ChatGPT에서 두 개의 실제 원본을 나란히 보며 `silhouette`, `direction`, `pixel-language`, `palette`, `character-appeal`, `scene-fit`의 **근거 있는 관찰**을 한다. Codex는 검사용 캡처/원본 메타데이터를 제공할 뿐 취향을 임의로 승인하지 않는다.
2. `art-review.json`에 `artDirectorReview: {actor: "chatgpt", reference: "실제 평가 출처", summary: "실제 관찰 요약"}`와 실제 6개 항목 관찰을 남긴다. 사용자 선택 전에는 `decision: "pending"`을 유지한다. 이 대화에서 받은 “전체 승인”은 프로세스 변경 승인이지 특정 PNG 선택 발언이 아니다.
3. 사용자가 NW/SE 두 원본을 **각각 직접 선택**하면 `reviewerRole: "user"`와 실제 `userDecision.quote/reference`를 기록하고 각각 검증한다. 같은 스타일/인물인지 시각적으로도 반드시 확인한다.
4. 두 미술 승인이 모두 유효할 때만 다음 native-base를 준비한다.

```powershell
node tools/prepare-sprite-job.mjs --art --stage native-base --out native-nw-rounded-02 --previous-job art/sprites/runs/lookdev-nw-rounded-02/job.json --previous-review art/sprites/runs/lookdev-nw-rounded-02/art-review.json --companion-job art/sprites/runs/lookdev-se-rounded-02/job.json --companion-review art/sprites/runs/lookdev-se-rounded-02/art-review.json
```

이 단계는 **NW 신체 1컷**이다. 64×96·정확한 픽셀격자·알파·앵커가 불가능하면 `blocked_native_delivery`로 남긴다. 이후 NW base+hair+top+bottom 파일럿과 캠프 실제 1배·주야간·좌석·가림 화면을 별도로 검증한다. 픽셀 파일럿 리뷰의 `artDirection`에는 승인된 NW `job/review`뿐 아니라 SE `companionJob/companionReview` 링크도 필수다. 최종 게임 원화/배포/전체 애니메이션 완성으로 주장하지 않는다.
