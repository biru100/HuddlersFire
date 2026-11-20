# 모닥불 캠퍼 · 플레이용 아트

PR #25 시안에서 선택한 밤색 단발, 필드 재킷, 청록 바지, 황갈색 부츠를 바탕으로 제작했다. 남동향 시안 한 장과 여기서 새로 나온 방향표를 ChatGPT 내장 이미지 생성에 입력했다. 별도의 유료 API 호출은 없었고 내부 모델 버전은 표시되지 않았다. 원본별 요청은 `briefs.json`, 원본 PNG의 SHA-256은 `sources.json`에서 확인할 수 있다.

- `turnaround`, `wardrobe`는 남동·북동·북서·남서 방향의 서기와 착석이다. 머리와 옷을 분리해 단발/묶은 머리와 재킷/후디 네 조합을 구성한다.
- `breath`, `breath-hood`는 자세, 팔꿈치, 머리카락과 눈이 함께 변하는 정지 호흡 키다. 기본 카메라에서 눈이 오래 감겨 있지 않도록 깜빡임 구간을 짧게 사용한다.
- `stride`, `stride-hood`에는 초기에 제작한 두 보폭의 원화가 있다. 게임은 아래의 고해상도 시트에서 실제 이동 거리에 맞춰 프레임을 선택한다. 고해상도 이미지 로딩 중에는 기본 아틀라스의 보행을 표시한다.
- `gestures`, `gestures-hood`는 손 흔들기, 들기, 박수, 조준, 점프, 웅크리기, 맞기, 춤의 키 포즈다. 달리거나 앉은 상태에서 이모트를 재생하면 하체와 상체를 합성한다. 동작 키의 기본 작화 방향은 남동이며, 후면에서는 방향별 뒷머리를 사용한다.

저장소 루트에서 `node web/scripts/build-camper-art.mjs`를 실행하면 투명 머리·몸통 아틀라스와 접점 메타데이터가 생성된다. 원본은 게임에 전송하지 않는다. 게임은 현재 색 슬롯, 사진 표시, 흑백 테마와 모션 감소 설정을 적용한다.

## 2026-11-21 · 재킷과 후디 걷기 시트

현행 `turnaround.png`와 `wardrobe.png`를 의상·인물 기준으로, [보행 가이드](walk-detail/pose-guide.png)를 자세 기준으로 사용해 ImageGen으로 두 전신 시트를 제작했다. 생성본은 `walk-detail/jacket-drawing.png`와 `hoodie-drawing.png`에 보존했다. 검토용 시트에는 투명 배경과 공통 중심점을 적용했다. 위부터 남동·북동·북서·남서이며 각 행은 왼쪽부터 여덟 프레임을 반복한다.

| 의상 | 원화 크기 · 셀 192×240 | 게임 크기 · 셀 64×80 |
| --- | --- | --- |
| 필드 재킷 | [투명 PNG](walk-detail/walk-jacket.png) | [투명 PNG](walk-detail/walk-jacket-64x80.png) |
| 후디 | [투명 PNG](walk-detail/walk-hoodie.png) | [투명 PNG](walk-detail/walk-hoodie-64x80.png) |

저장소 루트에서 `node web/scripts/pack-walk-detail.mjs`를 실행하면 두 원본의 SHA-256을 확인하고 전신 시트와 교차 착용용 투명 레이어를 출력한다. 보행 프레임 하나는 192×240이다. 머리는 턱과 목을 기준으로 정렬하고, 두 상의는 같은 걸음에서 발이 같은 높이에 닿게 맞춘다. 묶은 머리의 매듭과 단발 끝의 부피는 유지한다. [단발](walk-detail/head-bob.png) · [묶은 머리](walk-detail/head-bun.png) · [재킷](walk-detail/top-jacket.png) · [후디](walk-detail/top-hoodie.png)

`node web/scripts/render-walk-detail-preview.mjs`는 머리와 옷을 따로 선택해 캠프 장면(줌 1.5배, DPR 2)과 네 조합의 3배 확대 보행을 그린다. 게임에서는 `build-camper-art.mjs`가 만든 192×240 보행 레이어를 사용한다. 정지·착석·감정 표현과 로비 초상화는 64×80 아틀라스를 사용한다. [네 방향 착용표](walk-detail/wardrobe-fit.png) · [걷기 영상](walk-detail/walk-preview.webp) · [원화와 게임 크기의 확대 비교](walk-detail/walk-zoom-comparison.png)
