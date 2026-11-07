# HuddlersFire 시각 제작: 좋은 기준 한 컷부터

2026-11-07 활성 제작 경로. 이번 개편은 원화 생성 경로와 검수 흐름의 변경이지 전체 게임 그림의 교체나 배포가 아니다. [감사 기록](reviews/2026-11-07-art-pipeline-audit.md)을 함께 본다.

## 2026-11-07 활성 변경: ChatGPT 아트 디렉터 + NW/SE 2시점 검증

**책임:** ChatGPT는 원화 생성, 후보 비교, 실루엣·방향·픽셀 언어·색채·매력·장면 적합성의 미술 판단과 수정안을 담당한다. Codex는 원본 바이트/SHA256, 크기·알파·앵커·픽셀 격자, 조립과 테스트 및 실제 게임 캡처를 담당한다. Codex의 기술 PASS는 미술 PASS가 아니다. 사용자는 **구체적인 원본 PNG를 개별 선택**하고, 본 채팅에서의 프로세스 전체 승인은 어떤 PNG의 승인도 대체하지 않는다.

**최소 디자인 게이트:** 같은 캐릭터의 NW 뒷사선 1개 + SE 앞사선 1개를 각각 투명 배경 PNG로 확보하고 ChatGPT 미술 의견을 기록한 뒤 사용자의 두 이미지 선택을 받는다. 시트·UI·배경·라벨·여러 인물이 있는 그림은 비교 자료만 가능하며 단일 원본으로 수신할 수 없다. 네이티브 기본 신체 제작에는 승인된 NW·SE 두 job과 원본 해시가 필요하다.

**새 작업:** [Rounded 02 개선 브리프](briefs/nw-se-rounded-lookdev-02.md). 저장소 정책/생성 프롬프트 해시가 변경돼 이전 `lookdev-nw-rounded-01` job은 새 작업으로 재사용하지 않는다. 네이티브 64×96, 실제 캠프 장면, 배포는 모두 별도 검증 단계다.

## 현재 결정과 아직 미정인 것

유지: 고정 픽셀 쿼터뷰, 기존 팬/줌, 동석·작업·놀이·전시, 개인 사진과 온라인 기능. 기존 공개 원화는 롤백 경로다.

변경: 좋은 미술 기준을 확보하기 전에 기본 신체·48프레임·다양한 옷을 대량 생산하지 않는다. **ChatGPT NW·SE 착의 디자인 비교 → 각각의 ChatGPT 미술 평가 및 사용자 원본 승인 → NW 기본 신체 한 컷 → 소수 레이어 → 실제 캠프 한 구역 → 나머지 방향과 동작**으로 진행한다. 착의 시안은 기본 신체를 추출/잘라내는 재료가 아니라 비율과 디자인의 기준이다. 가려진 신체를 복원했다고 주장하지 않는다.

미정: 승인된 픽셀 기준작, 공통 앵커/격자의 미술 승인, 실제 주야간 가독성. `64×96`, 발/머리 위치는 `scene-spec.json.pixelQuarterview.avatar`에 있는 제작 목표다. 규격을 임의 완화하거나 이전 (32,18) 머리 제안을 되살리지 않는다. 현재 제안은 머리 (32,28)이다.

## 책임과 한 곳에서 관리할 값

| 책임 | 담당 / 기준 |
| --- | --- |
| 원화·반복 편집·미술적 검토 | ChatGPT 이미지 제작 대화. 요청 모델은 `art/sprites/art-direction.json` |
| 생성 모델 검증 | 요청 모델과 실제 도구 응답의 모델을 분리. 관찰 불가면 null/unverified |
| 요청서·파일 보존·기술 검사·조립·캡처·테스트 | Codex와 저장소 도구. 미술적 승인 판정 금지, 무단 모델 대체·유료 API 호출 금지 |
| 투영·캔버스·상태 프레임·앵커 제안 | 기존 `art/sprites/scene-spec.json.pixelQuarterview`만 사용 |
| 파일 출처·기술 조사 | 작업별 submission.json, build/art-intake.json |
| 미술 선택 | 실제 사용자 결정과 정확한 원본 SHA256. 에이전트가 승인 문구를 만들지 않음 |
| 게임 내 동작·조명·가림 | 기존 pixel catalog와 실제 renderer/UI evidence |

OpenAI 제품 발표의 모델 제공 범위와 특정 Codex 환경에서 실제 호출된 모델은 별개다. 요청 경로는 사용자 지정에 따르되, “2.6이면 무조건 더 좋은 도트/정확한 64×96”이라고 보증하지 않는다. 전역 스킬이나 개인 Codex 설정은 바꾸지 않는다.

## 미술 판단 기준

수치 점수나 PNG 형식은 취향을 판정하지 않는다. 아래 여섯 항목에는 실제 그림을 보고 구체적인 관찰을 쓴다.

- **silhouette:** 머리만 커지고 몸이 실처럼 얇아지지 않는가. 손·발·상의 형태가 작은 표시에서도 구분되는가.
- **direction:** NW는 등과 뒤통수가 보이는 왼쪽 위 뒷사선인가. 귀 하나나 이름표만으로 방향을 선언하지 않는가.
- **pixel-language:** 외곽의 계단과 색면이 의도적인가. 잔점, 서로 다른 픽셀 크기, 가짜 도트/흐린 테두리가 없는가.
- **palette:** 따뜻한 피부와 옷·숲 사이 명도 관계가 좋은가. 억지 색 수 제한 대신 필요한 명암을 사용했는가.
- **character-appeal:** 가만히 있어도 입히고 싶은 옷과 기억할 실루엣이 있는가. 기존 기각본보다 무엇이 나아졌는가.
- **scene-fit:** lookdev에서는 캠프에 어울리는 디자인인지 판단한다. 실제 게임 접지·조명·좌석 적합성은 별도 장면 검증까지 미확인이다.

매력 없는 후보는 “일단 규격이 맞으니 확장”하지 않는다. compact/rounded/graphic은 비교용 디자인 가설이지 승인된 스타일이 아니다. 최대 세 차례 개선 뒤에도 기준을 못 찾으면 같은 지시를 반복하기보다 해상도 목표·제작 방식·디자인 제약 중 무엇을 바꿀지 근거를 정리한다. 이 횟수는 운영 지침이며 자동 차단 카운터는 아니다.

## 1. 착의 시안 단계: 현재 NW+SE 각각 한 컷

첫 요청 당시의 이력은 [NW 착의 기록](briefs/nw-clothed-lookdev-01.md)에 보존한다. **현재 신규 생성은 [Rounded 02 브리프](briefs/nw-se-rounded-lookdev-02.md)의 NW·SE 개별 요청 명령을 사용한다.** 사용자가 요청한 둥글고 귀여운 실루엣에 맞춰 rounded를 첫 **디자인 가설**로 준비했으며, 미술 승인을 뜻하지 않는다. 최종 복사용 요청문은 [ROUNDED 요청문](briefs/nw-clothed-lookdev-01.txt)이다.

| 후보 | 비교할 차이 | 고정할 것 |
| --- | --- | --- |
| compact | 짧고 다부진 비율, 몸 가까운 소매, 응축된 외곽 | 같은 NW 정지 자세, 곱슬머리·세이지 후드·긴 바지·갈색 신발, 중립광 |
| rounded | 둥근 뒤통수와 어깨·소매의 부피, 포근한 덩어리 | 동일 |
| graphic | 중립 체형에서 색면·외곽 단순화, 최소한의 주름·곱슬 묶음 | 동일 |

세 가지는 서로 배타적인 미술 장르가 아니라 비교할 강조점이다. 한 요청에 세 명을 그리지 않는다. 첫 rounded가 약한 지점을 확인한 다음 비교 목적에 맞는 후보만 별도 생성한다.

프로젝트 루트에서:

```sh
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation compact --out lookdev-nw-01
```

다른 후보는 `--variation rounded` 또는 `graphic`, 새로운 `--out`을 사용한다. 생성되는 `CHATGPT_REQUEST.txt`만 ChatGPT에 보낸다. 현재 미승인 시트/코드로 만든 신체는 자동 첨부하지 않는다. 과거 그림을 반드시 비교해야 할 때는 기각 사유를 함께 알려 기준작과 구분한다.

이 단계는 NW와 SE를 **각각 단 한 명의 캐릭터로 다른 job에** 생성한다. 아래 구형 `compact` 명령은 첫 NW 시안 예시이며 최신 NW·SE 명령은 Rounded 02 문서를 따른다. 큰 생성 PNG도 **LOOKDEV_ONLY**로 비교할 수 있다. 이는 해상도 제약을 숨기려는 예외가 아니라 디자인 선정과 실제 네이티브 납품의 분리다. 큰 이미지를 축소하거나 도형으로 다시 그려 원본이라고 표시하지 않는다.

## 2. 원본 수신과 검토

ChatGPT에서 **다운로드한 원본 PNG**를 첨부하거나 로컬 경로를 전달한다. 화면 캡처, 메신저 재압축 미리보기, 리사이즈본을 원본으로 받지 않는다. 생성한 후보 이름과 대화 링크/모델 표시 정보를 함께 주면 출처에 기록한다. 실제 모델을 확인할 수 없다면 null/unverified로 남긴다.

권장 수신은 기존 rebuild 명령에 `--source`를 한 번만 주는 방법이다. 원본 바이트를 그대로 `source/candidate.png`에 배타적으로 복사하고 원본명·SHA256·출처 참조를 `submission.json`에 기록한 뒤 실제 PNG inspector를 실행한다. 기존 원본이나 receipt가 있으면 덮어쓰지 않는다. 새 후보는 새 job으로 받는다. PNG를 올렸다는 사실은 승인과 다르며 첨부 ZIP의 스크립트를 실행하지 않는다.

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-nw-01/job.json --source "C:\Downloads\original.png" --source-reference "ChatGPT 대화 링크 또는 전달 출처"
```

이미 수신한 job의 재검사는 `--source` 없이 실행한다. 수동으로 수신할 때도 원본을 수정하지 않고 template을 복사해 실제 사실만 기록한다. native-base의 RGB/앵커는 관찰 후 채우며 자동 수신이 이를 측정했다고 간주하지 않는다.

```sh
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-nw-01/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/lookdev-nw-01/job.json
```

기존 raster inspector로 원본 크기·투명도·색을 조사한다. 이미지가 차단되면 보고서를 남기고 rebuild는 종료 코드 2를 반환한다. 원본을 수정하지 않는다. 생성된 `art-review.html`은 밝고 어두운 바탕, 원본 100%, 종횡비를 보존한 작은 표시 가설, 모델 경고·차단 사유와 여섯 관찰 항목을 보여 주는 오프라인 정적 페이지다. **실제 밤 조명·WebGL·좌석 검증이 아니다.** 작은 표시는 원본 전체를 spec의 목표 캔버스 안에 맞추는 CSS 표시이며 파일 축소나 실제 픽셀 밀도 증거가 아니다. 네이티브 이미지의 4배 표시도 CSS 정수 확대이며 별도 4배 PNG 납품을 대체하지 않는다.

`art-review.template.json`은 미검토 상태로 생성된다. ChatGPT 미술 판단의 실제 대화 출처/요약을 `artDirectorReview.actor/reference/summary`로 기록하고, 사용자가 **해당 방향의 해당 원본을 개별 선택했을 때만** reviewer, 정확한 결정 문구/출처를 기록한다. `reviewerRole:user`라고 써 놓는 것이 사람 신원을 인증하는 것은 아니다. 이 장치는 추적 가능한 절차이며 승인 위조를 허용하지 않는다.

```sh
node tools/review-sprite-job.mjs --job art/sprites/runs/lookdev-nw-01/job.json --review art/sprites/runs/lookdev-nw-01/art-review.json
```

미술 승인 결과도 `productionReady:false`, `runtimeVerified:false`다. 원본·receipt·정책·제작 계약·검사 도구가 바뀌면 기존 승인을 재사용하지 않는다. 형식 검사가 NW 방향이나 멋진 손발을 자동 판정하지는 않는다.

## 3. 승인 시안에서 NW 기본 신체 제작

```sh
node tools/prepare-sprite-job.mjs --art --stage native-base --out native-nw-rounded-02 --previous-job art/sprites/runs/lookdev-nw-rounded-02/job.json --previous-review art/sprites/runs/lookdev-nw-rounded-02/art-review.json --companion-job art/sprites/runs/lookdev-se-rounded-02/job.json --companion-review art/sprites/runs/lookdev-se-rounded-02/art-review.json
```

**NW와 SE 부모 모두 사용자가 승인했을 때만** 진행하며 같은 바이트의 `REFERENCE.png`(NW) 및 `REFERENCE_SE.png`(SE)를 전달한다. 이번에는 얼굴·머리카락·옷·액세서리 없이 NW 기본 신체 하나만 요청한다. 앵커·캔버스는 scene spec에서 자동으로 가져온다. 제출 PNG는 원래 64×96이며 실제 alpha 0/255, 정확한 RGB 표와 앵커 메타데이터가 필요하다. 뒤통수·어깨·골반·발의 회전은 사람이 확인한다. 피부 치환 마스크는 후속 레이어 납품의 필수 자료이며 이 검사에서 생성하지 않는다.

생성기가 큰 이미지나 반투명 이미지를 반환하면 `blocked_native_delivery`다. 여기에 새 이미지를 만들어 넣거나 강제 축소·6색 변환·알파 threshold로 통과시키지 않는다. 선택지는 도구의 실제 네이티브 지원 확인, 픽셀 편집 작업의 별도 승인, 또는 다른 논리 해상도 제안이다. **현재 승인 없이 방법/해상도를 바꾸지 않고 막힌 원인을 보고한다.** 모델 이름을 바꾸는 것만으로 해결됐다고 하지 않는다.

## 4. 레이어와 실제 캠프

신체 승인 뒤 기존 [제작 명세](sprite-authoring.md)의 catalog에 실재하는 파일/방향/프레임만 등록한다. 우선 같은 NW idle의 base, hair 1종, top 1종, bottom 1종을 맞춘다. 한 방향만 되는 초안을 4방향 커스터마이징으로 발표하지 않는다. 방향/포즈/캔버스/시간/앵커가 안 맞으면 전체 기존 캐릭터로 폴백한다.

```sh
node tools/prepare-sprite-job.mjs --pixel --out pixel-scene-01
node tools/rebuild-sprites.mjs --job art/sprites/runs/pixel-scene-01/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/pixel-scene-01/job.json
node tools/review-sprite-job.mjs --job art/sprites/runs/pixel-scene-01/job.json --review art/sprites/runs/pixel-scene-01/review.json
```

pixel review에는 기존 evidence 외에 아래 필드를 더한다. `assets`에는 **현재 시험하는 모든 pilot의 실제 ID와 파일 SHA256**을 넣는다. 예시 문자열은 실제 값으로 대체한다.

```json
{
  "artDirection": {
    "job": "art/sprites/runs/lookdev-nw-rounded-02/job.json",
    "review": "art/sprites/runs/lookdev-nw-rounded-02/art-review.json",
    "companionJob": "art/sprites/runs/lookdev-se-rounded-02/job.json",
    "companionReview": "art/sprites/runs/lookdev-se-rounded-02/art-review.json",
    "assets": [{"id": "ACTUAL_ASSET_ID", "sha256": "ACTUAL_SHA256"}]
  },
  "userDecision": {"actor": "user", "quote": "실제 조립 시안 선택 발언", "reference": "대화 또는 리뷰 출처"}
}
```

추가 미술 게이트는 `review-sprite-job.mjs`의 pixel CLI에 통합돼 있다. `verifyPixelReview` 단독 호출은 기존 기술/장면 정합성 검사이므로 최종 승인 API로 사용하지 않는다. 현재 자동 production installer는 추가하지 않았다. 옛 pixel build의 `CHATGPT_REQUEST.txt`/`REQUEST_MISSING_ASSETS.md`는 과거 NW 기본 신체 요구이며 **활성 생성 요청은 반드시 --art로 새로 준비한다.**

실제 장면은 [장면 구성 기준](scene-composition.md)으로 사람 > 자리 > 길/포탈 > 숲을 확인한다. 1배, 주/야간, 나무 앞뒤, 벤치 접촉, 사진/이름, UI가 열린 상태를 각각 기록한다. 밤에 안 보이면 원화 팔레트를 무작정 밝히기 전에 실제 조명을 확인한다. 큰 아틀라스 생산과 네트워크 커스터마이징은 이후 별도 작업이다.

## 검증과 보고

독립 규칙·스킬 참조 검사: `cd web` → `npm.cmd run test:art-direction`. 실제 PNG 디코딩·수신 CLI 검사: `npm.cmd run test:art-intake` (프로젝트 의존성 필요). 후자는 테스트 전용 1픽셀 PNG로 빈 이미지 차단·원본 보존·중복 수신 거절·변경 원본 차단·native 납품 차단·HTML 생성을 검사하며 실제 미술 승인이 아니다. 정상 의존성이 있는 프로젝트에서 관련 `test:sprites:pipeline`, `typecheck`, `build`, 실제 pixel/browser 검사를 실행한다. 지금 이미지가 없어서 하지 못한 검사를 통과로 쓰지 않는다.

`npm.cmd run test:browser:art-review`는 기존 CDP helper와 별도 일회성 headless Chrome 프로필로 **테스트용 PNG의** 데스크톱/모바일 검토 페이지를 검사한다. 개인 브라우저 UI는 사용하지 않는다. `CAMP_TEST_BROWSER`로 실행 파일을 지정할 수 있으며 기본은 기존 Windows Chrome 경로다. 출력은 `/outputs/art-review-smoke-desktop.png`, `/outputs/art-review-smoke-mobile.png`다. 이 검사는 HTML 표시 준비의 근거이며 캐릭터 품질·게임 WebGL 검증이 아니다. 이번 환경에서는 샌드박스의 `Runtime.enable` 시간 초과 뒤 일반 실행 권한에서 통과했다.

보고는 원화 생성, 기술 정합성, 미술 선택, 실제 장면, 기능 회귀, 배포 상태를 구분한다. 이 하네스는 더 좋은 그림을 보장하지 않지만, 나쁜 결과를 기술 PASS만으로 확장하거나 다른 방식으로 몰래 바꾸는 경로를 막는 것이 목적이다.
