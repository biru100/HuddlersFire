# 모닥불 캠퍼 · 플레이용 아트

## 전체 재생성 작업 시작

`camp-art-direction`에 따라 현재 Codex 세션에서 기준 원화·키포즈와 레이어 후보를 제작한다. 생성한 PNG의 실제 바이트와 프롬프트·SHA-256을 보존하며, 사용자가 선택한 방향의 파생 네이티브 입력을 등록한다. [원화 제작과 미술 선택](../../../.agents/skills/camp-art-direction/SKILL.md)

2026-11-22 첫 서기 후보는 사용자가 수정 요청했다. 기존 남동향 원화를 참조해 눈매·앞머리 실루엣·짧은 체형을 복원한 서기 후보를 준비했다. [현행·첫 후보·수정 후보 비교](lookdev-reference-20261122/standing-comparison.png) · [캠프 표시 크기](lookdev-reference-20261122/camp-comparison.png) · [새 원본 기록](lookdev-reference-20261122/manifest.json)

사용자가 수정 후보를 후속 제작의 기준으로 선택했다. 눈 하이라이트와 앞머리 명암을 더 분명하게 다듬어 네 방향, 두 헤어·의상, 보행, 착석, 호흡·깜빡임과 제스처에 적용했다. [착용·착석 비교](subculture-20261122/wardrobe-motion-review.png) · [보행 반복](subculture-20261122/walk-loop-review.webp) · [원본과 파생본 기록](subculture-20261122/manifest.json)

선택된 전체 세트는 `web/`에서 `node scripts/compile-subculture-camper.mjs`로 생성한다. 네 방향의 고정된 얼굴과 두 헤어, 의상별 동작에서 몸통과 앞손을 조립한다. 192×240 보행에는 몸통·다리만 넣고 걸음에서도 같은 64×80 얼굴·헤어를 사용한다. `--install`은 해시와 디코딩 검사가 일치하는 두 아틀라스를 등록한다. `npm run sprites:camper -- --check`는 등록된 파일을 다시 만든다. [선택된 아틀라스](subculture-20261122/release.json) · [얼굴 규격](subculture-20261122/release-head.json)

### 이전 원화 작업 재현

`web/`에서 이름을 정해 작업을 준비한다. `prepare`가 [제작 규격](camper-spec.json)에서 원화 요청서 `brief.md`와 입력 목록 `inputs.json`을 만든다. 작업 폴더는 `web/outputs/camper-harness/<작업명>`이다.

```sh
npm run sprites:camper -- prepare camper-rebuild
npm run sprites:camper -- review camper-rebuild before
# input/에 요청서에 적힌 원본 PNG를 놓은 뒤 실행한다.
npm run sprites:camper -- register camper-rebuild
npm run sprites:camper -- build camper-rebuild
npm run sprites:camper -- review camper-rebuild after
npm run sprites:camper -- review camper-rebuild compare
npm run sprites:camper -- verify camper-rebuild
```

새 작업의 `register`는 기본 원화 8장, 보행 원화 2장, 기본 머리·헤어 마스터 3장 등 **PNG 13장**을 읽고 SHA-256을 기록한다. 새 원화에서 원본 해상도나 목 높이가 달라지면 `inputs.json`의 `calibration`에 실측값을 적는다. `build`는 등록된 입력과 명세를 바탕으로 기본 아틀라스와 몸통·다리로 구성한 3072×960 보행 WebP를 `candidates/<후보 해시>/`에 보관한다. `check <작업명>`은 같은 입력으로 두 아틀라스를 재현하고 `verify <작업명>`은 후보와 장면 캡처의 해시도 대조한다.

현행 원본으로 연습하려면 `prepare <작업명> --from-current`를 사용한다. 이때 입력 해시는 기존 등록 기록에서 읽으며 `register` 단계는 생략한다. `npm run sprites:camper -- --check`는 CI에서 현행 마스터와 등록 아틀라스를 대조하는 명령이다. [실제 장면과 브라우저 검수](../../../docs/art/scene-first-review.md#캠퍼-전체-재생성-후보-검수)

## 공통 머리와 교체형 헤어

로비 초상화와 필드 캐릭터는 같은 자세에서 동일한 머리 스프라이트를 그린 뒤 단발 또는 묶은 머리를 얹는다. 공통 머리에는 두피·귀·얼굴·턱과 표정이 있다. 얼굴과 귀가 드러난 묶은 머리 원화에서 이 부분을 분리하고 가려진 두피를 채웠다. 앞머리와 매듭은 헤어에, 얼굴 옆으로 올라오는 손은 해당 의상과 팔에 속한다. [파츠별 확대](shared-head/layers.png) · [실제 렌더러의 네 조합](shared-head/wardrobe.png)

**제작 기준.** 새 헤어는 해당 방향의 공통 머리 위에 그린다. 얼굴·귀·턱의 위치와 목 접점은 공통 머리를 따른다. [조립 레시피](shared-head/recipe.json)에 네 방향의 헤어 경계선, 두 해상도에서의 머리 경계 및 눈·코·턱의 보호 영역이 있다. 로컬 게임에서 정지와 보행은 방향마다 같은 64×80 머리와 헤어를 그린다. 여덟 걸음 프레임은 192×240 몸통과 다리로 이어지며, 머리와 헤어가 걸음에 맞춰 같이 오르내린다.

| 편집용 투명 PNG | 기본 동작·보행에 쓰는 공통 파츠 | 이전 아틀라스 재현용 보행 파츠 |
| --- | --- | --- |
| 공통 머리·표정 | [기본 머리](shared-head/masters/face-native.png) | [보행 머리](shared-head/masters/face-walk.png) |
| 단발 헤어 | [기본 단발](shared-head/masters/bob-native.png) | [보행 단발](shared-head/masters/bob-walk.png) |
| 묶은 헤어 | [기본 묶음](shared-head/masters/bun-native.png) | [보행 묶음](shared-head/masters/bun-walk.png) |

헤어 수정은 작업 폴더에 해당 마스터의 편집본을 둔 뒤 `register`로 기록한다. 현행 마스터의 해시는 [파츠별 원본 SHA-256](shared-head/masters/sources.json)에 있다. 최초 분리 도구 `extract-camper-head-masters.mjs`는 초기 원화를 분리한 과정을 기록하며 편집용 폴더가 이미 있으면 멈춘다.

**검사와 미술 선택.** `review after`가 후보의 파츠별 이미지와 실제 렌더러의 착용표를 출력한다. 하네스는 최종 WebP의 머리 범위, 헤어에 남은 피부색, 보호 영역의 가림, 목·발 접점과 팔레트를 검사한다. 눈·앞머리·목선이 실제 배율에서 잘 읽히는지는 전후 장면에서 판단한다. 현행 게임에 등록한 파일은 [머리 파츠 명세](shared-head/manifest.json)에 있고, 새 후보의 미술 선택과 게임 채택은 작업 폴더의 후보 해시를 기준으로 기록한다.

**구형 경로의 전환 순서.** 새 캠퍼를 사용자가 선택하고 로컬 게임에서 아틀라스 교체를 검증한 뒤 `--candidate`, 구형 `--use-local`, `readCamperIntermediate()`와 남은 렌더러 분기를 정리한다. 이때 제작·검수·패키징에서 참조가 끝난 생성 파일을 선별한다. `CAMPER_SOLES`, 기본 해상도 보행 폴백, 승인 원본과 직전 롤백본은 보존한다.

### 원화와 이전 조립본

PR #25 시안에서 선택한 밤색 단발, 필드 재킷, 청록 바지, 황갈색 부츠를 바탕으로 제작했다. 남동향 시안 한 장과 여기서 새로 나온 방향표를 ChatGPT 내장 이미지 생성에 입력했다. 별도의 유료 API 호출은 없었고 내부 모델 버전은 표시되지 않았다. 원본별 요청은 `briefs.json`, 원본 PNG의 SHA-256은 `sources.json`에서 확인할 수 있다.

- `turnaround`, `wardrobe`는 남동·북동·북서·남서 방향의 서기와 착석이다. 머리와 옷을 분리해 단발/묶은 머리와 재킷/후디 네 조합을 구성한다.
- `breath`, `breath-hood`는 자세, 팔꿈치, 머리카락과 눈이 함께 변하는 정지 호흡 키다. 기본 카메라에서 눈이 오래 감겨 있지 않도록 깜빡임 구간을 짧게 사용한다.
- `stride`, `stride-hood`에는 초기에 제작한 두 보폭의 원화가 있다. 게임은 아래의 고해상도 시트에서 실제 이동 거리에 맞춰 프레임을 선택한다. 고해상도 이미지 로딩 중에는 기본 아틀라스의 보행을 표시한다.
- `gestures`, `gestures-hood`는 손 흔들기, 들기, 박수, 조준, 점프, 웅크리기, 맞기, 춤의 키 포즈다. 달리거나 앉은 상태에서 이모트를 재생하면 하체와 상체를 합성한다. 동작 키의 기본 작화 방향은 남동이며, 후면에서는 방향별 뒷머리를 사용한다.

## 현행 캠퍼의 크기·색 규격과 재생성

새 원화를 요청할 때 [제작 규격](camper-spec.json)을 함께 전달한다. 기본 셀은 64×80이며 192×240 보행 원화에서는 같은 길이를 3배로 그린다. 정지·호흡·보행에 같은 얼굴과 바지·부츠 색을 쓰고, 재킷과 후디는 별도 원단색을 사용한다. 조명은 중립 상태로 그린다. 캠프의 불빛과 참가자가 고른 색은 게임에서 입힌다.

- **크기** — 머리 폭은 불투명한 가로줄 길이의 80백분위수로 측정한다. 헤어별 네 방향의 목표 폭과 목에서 정수리까지 높이는 규격에 있다. 단발 옆머리와 묶은 머리의 매듭을 각각 포함한다. 목 중심은 (32, 40)이고, 보행에서는 체중 이동에 맞춰 오르내린다. 앉기와 제스처는 자세별 발 접점을 쓴다.
- **색** — 공통 머리·피부·바지·부츠, 고유 재킷·후디의 중간색을 지정한다. 검사기는 실제 칠한 영역의 불투명 픽셀에서 RGB 채널별 중앙값을 측정한다. 재생성은 명암과 외곽선을 보존하도록 색 보정을 주변 색에 연속적으로 적용한다.
- **검사** — 원본과 머리 마스터의 SHA-256 및 잘림을 확인한다. 최종 WebP를 다시 열어 크기, 발, 재질별 색과 교차 착용의 목 이음새를 확인한다. 머리 폭·높이 허용치는 게임 크기 1.5픽셀, 발은 1픽셀, 중간색은 채널당 15다. 현재 캠퍼 검토본의 작업값이다.

`web/`에서 실행한다.

```sh
npm run sprites:camper
npm run sprites:camper -- --check
npm run art:review:camper
```

인수 없이 빌드한 후보는 `current` 작업 폴더에 생성되고 `art:review:camper`가 이 후보의 착용 비교를 출력한다. [구형 중간 아틀라스와 해시](consistency/manifest.json)는 이전 검토 기록이다. `node web/scripts/build-camper-art.mjs --check`는 v49 아틀라스 재현에 사용한다.

## 2026-11-21 · 재킷과 후디 걷기 시트

현행 `turnaround.png`와 `wardrobe.png`를 의상·인물 기준으로, [보행 가이드](walk-detail/pose-guide.png)를 자세 기준으로 사용해 ImageGen으로 두 전신 시트를 제작했다. 생성본은 `walk-detail/jacket-drawing.png`와 `hoodie-drawing.png`에 보존했다. 검토용 시트에는 투명 배경과 공통 중심점을 적용했다. 위부터 남동·북동·북서·남서이며 각 행은 왼쪽부터 여덟 프레임을 반복한다.

| 의상 | 원화 크기 · 셀 192×240 | 게임 크기 · 셀 64×80 |
| --- | --- | --- |
| 필드 재킷 | [투명 PNG](walk-detail/walk-jacket.png) | [투명 PNG](walk-detail/walk-jacket-64x80.png) |
| 후디 | [투명 PNG](walk-detail/walk-hoodie.png) | [투명 PNG](walk-detail/walk-hoodie-64x80.png) |

저장소 루트에서 `node web/scripts/pack-walk-detail.mjs`를 실행하면 두 원본의 SHA-256을 확인하고 전신 시트와 교차 착용용 투명 레이어를 출력한다. 보행 프레임 하나는 192×240이다. 머리는 턱과 목을 기준으로 정렬하고, 두 상의는 같은 걸음에서 발이 같은 높이에 닿게 맞춘다. 묶은 머리의 매듭과 단발 끝의 부피는 유지한다. [단발](walk-detail/head-bob.png) · [묶은 머리](walk-detail/head-bun.png) · [재킷](walk-detail/top-jacket.png) · [후디](walk-detail/top-hoodie.png)

`node web/scripts/render-walk-detail-preview.mjs`는 머리와 옷을 따로 선택해 캠프 장면(줌 1.5배, DPR 2)과 네 조합의 3배 확대 보행을 그린다. 게임에서는 `build-camper-art.mjs`가 만든 192×240 보행 레이어를 사용한다. 정지·착석·감정 표현과 로비 초상화는 64×80 아틀라스를 사용한다. [네 방향 착용표](walk-detail/wardrobe-fit.png) · [걷기 영상](walk-detail/walk-preview.webp) · [원화와 게임 크기의 확대 비교](walk-detail/walk-zoom-comparison.png)
