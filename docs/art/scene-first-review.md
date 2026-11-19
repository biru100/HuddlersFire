# 캠프 화면에서 검토하는 아트 생성 하네스

플레이어가 모닥불에 다가올 때 누구의 얼굴인지, 어디에 앉을 수 있는지, 무엇이 바닥인지 기본 카메라에서 구별할 수 있어야 한다. 첫 단위는 남동향 캐릭터 한 명, 2인 벤치 하나, 벤치 밑 바닥 한 구역이다. [첫 결과와 전후 비교](../../art/sprites/scene-reviews/camp-circle-se/README.md)

## 게임에 반영한 뒤의 확인

검토 영수증은 제출 당시 원본·기준 화면을 고정한다. `npm run art:review:camp`는 그 시점의 스프라이트를 사용한다. 현재 게임에 들어간 모습을 확인하려면 `web/`에서 `npm run test:render`를 실행해 `outputs/camp-art-live-desktop.png`와 `outputs/camp-art-live-mobile.png`를 연다. 두 화면은 일반 플레이와 동일한 렌더러·착석 계산·아트 로딩 경로로 그린다. 다른 머리와 상의를 입은 두 사람이 같은 모닥불에서 서 있고 앉아 있다.

## 생성과 수정

1. 작업별로 `art/sprites/scene-reviews/<job>/`를 만든다. `briefs/camper.txt`, `bench.txt`, `ground.txt`를 독립적으로 작성한다. 같은 2:1 투영, 주광 방향, 명암의 우선순위를 글로 공유한다. 캠퍼는 얼굴·앞머리가 차지할 픽셀 수와 턱 아래부터 발바닥까지의 길이를 명시한다. 벤치는 앉는 면과 지지대가 보이게, 바닥은 발보다 명암 차이가 작게 요청한다.
2. 기존 예시 manifest에서 작업 식별자와 세 텍스트 파일의 SHA-256을 새 값으로 지정하고 `files`를 빈 객체로 시작한다. 아래 preflight로 텍스트 입력만 확인한다. 요청마다 이미지 참조 없이 생성하고 투명 원본을 `originals/{camper,bench,ground}.png`에 보존한다. 모델 식별자가 표시되지 않으면 null로 남긴다.
3. `recipe.json`에 각 원본의 자를 영역, 논리 픽셀 위치, 발과 상판 접점, 바닥 경계 폭을 기록한다. 캐릭터의 머리·상의·하체를 각자 편집할 수 있도록 같은 크기의 투명 레이어로 뽑는다. 크기나 비율을 조정한 경우 원본과 게임용 결과를 함께 놓고 얼굴·손실된 디테일을 확인한다. 이 파일럿의 64×96은 시험 캔버스다.
4. 게임의 Canvas 렌더러로 PC 1050×824와 모바일 390×520에서 전후를 출력한다. 같은 좌표, 시간, 조명, follow 카메라, zoom 1을 사용한다. 한 자리는 기존 캐릭터가 앉고 다른 자리는 비워 둔다. 좌석 중심은 게임의 실제 착석 접점에서 계산하고 바닥은 조명·그림자보다 먼저 그린다. 한국어 대체 서체 위치는 필요 시 `CAMP_REVIEW_KOREAN_FONT`로 지정한다.
5. 모바일 1배율에서 눈과 머리 방향, 재킷과 바지의 경계, 발이 닿는 위치, 벤치에서 엉덩이가 뜨는지, 바닥 패치의 테두리가 보이는지 먼저 본다. 이후 확대본과 원본에서 잃은 부분을 적는다. 사람이 새 베이스를 고른 뒤 헤어 2종 × 상의 2종, 전신이 반응하는 Idle 순으로 진행한다. 같은 기준을 다음 환경 소품과 캠프 구역에 적용한다.

## 실행

저장소 루트에서 `job`을 선택한다. 첫 실행 전에는 `(cd web && npm ci)`로 의존성을 설치한다.

```sh
job=camp-circle-se
receipt=art/sprites/scene-reviews/$job/manifest.json
node tools/verify-pixel-cleanroom.mjs "$receipt" --preflight
(cd web && npm run art:review:camp -- "$job")
node tools/verify-pixel-cleanroom.mjs "$receipt" --inventory
node tools/verify-pixel-cleanroom.mjs "$receipt"
```

새 제출에서는 inventory 결과를 검토한 뒤 해당 manifest의 `files`에 기록하고 마지막 명령을 실행한다. 등록한 작업에서 해시가 달라지면 변경된 파일과 폰트·렌더 환경을 확인한다. CLI는 등록된 해시를 자동으로 갱신하지 않는다. 승인된 원본과 예전 거절 기록을 덮어쓰지 않는다. 이 경로는 오프라인 검토 이미지만 출력한다. 미술 선택, 런타임 채택과 배포는 각각 별도 결정이다.
