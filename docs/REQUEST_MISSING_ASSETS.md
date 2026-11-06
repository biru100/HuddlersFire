# 추가 이미지 제작 요청 · 픽셀 쿼터뷰

상태: 요청 규격 초안. 현재 원본에서 승인된 공통 픽셀 격자/기본 신체가 없으며 아래 캔버스와 앵커는 **제작 목표 제안**이다. 새 기본 신체 1컷을 먼저 검토하고 동일 규격으로 부분 제작한다.

- 참조: art/sprites/pixel-quarterview/incoming/v0.1/assets/source/characters.png (인물·색감만), environment.png (소품만). scene_mood.png는 분위기 전용.
- 실제 투영: screen=((x-y)*40,(x+y)*20), 정사각형=80×40. NW=(-1,0), NE=(0,-1), SW=(0,1), SE=(1,0). 카메라 회전 금지, 기존 팬·줌은 유지.
- 논리 캔버스: 64×96px, 모든 레이어 동일. feet=[32,88], head=[32,18], bench seat=[32,62]. 앵커는 프레임마다 기록하며 같은 자세의 레이어끼리 정확히 일치.
- 우선 기본 신체/피부, 헤어 2종(short_curly/bob), 상의 2종(hoodie/knit), 하의 1종을 각각 분리. 이어 모자/헤드폰, 표정, 액세서리. 긴 머리와 모자는 앞/뒤 레이어 분리.
- 각 NW/NE/SW/SE에 idle 1, walk 6, sit_bench 1, emote 4프레임. 프레임 이름과 시간(ms) 동일; walk=100ms×6, emote=150ms×4. 단일 포즈 PNG 또는 정확한 프레임 좌표표 제출. 좌우 반전/늘이기로 방향을 대체하지 않는다.
- 가림 순서: back_hair → base/skin → bottom → top → face → front_hair → headwear → accessory. 손 앞/뒤는 포즈별 명시.
- 1 논리 픽셀, 불투명 색과 alpha=0/255, 안티앨리어싱/글로우/바닥 그림자/라벨 금지. 피부·머리·옷 색상은 정확 RGB 팔레트 표와 치환 영역 마스크 제출. 기존 사진은 생성기에 입력하지 않는다.

## 소품

- 벤치: 세계 축에 맞춘 두 축(화면 기울기 ±0.5), 네 착석 facing. ground/seat 접점과 두 seat slot을 같은 캔버스에 좌표로 명시; 현재 bench_ne/nw/se/s는 투영 미확정이므로 그대로 승인하지 않는다.
- 모닥불: 돌/장작의 비발광 바닥 레이어, 6프레임 불꽃, 발광 마스크를 분리. 공용 불 성장/외형 5종은 기존 ID를 유지하며 누락 시 기존 표현. 빛은 renderer가 계산.
- 나무 1종, 랜턴 1종, 라디오: 지면 접점, 논리 캔버스, 표시 크기, 충돌 footprint 별도. 밝은 테두리/빨간 잔여 픽셀 제거.
- 경로: 2:1 화면 사진을 타일로 간주하지 않는다. 원본 정사각 타일의 크기와 각 방향 접속 마스크·직선/모서리/T/교차/끝을 제출하고 실제 3×3 반복 검사를 통과한다.

## 전달 파일

PNG 원본 + 각 파일의 방향/상태/레이어/frames/durations/canvas/frameAnchors/paletteId + 출처. catalog.json의 variants[direction][state]에 등록한다. 검사는 기존 prepare-sprite-job --pixel → rebuild-sprites --job → render-scene-preview --job → review-sprite-job --job 순서. PNG에 없는 프레임을 검증기가 만들어 주지는 않는다.
