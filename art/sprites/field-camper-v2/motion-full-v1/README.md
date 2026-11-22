# 캠퍼 전체 동작 미술 후보

캠퍼가 불멍 자리에서 일어나고 놀이터에서 움직일 때 방향, 발 접점, 몸짓을 읽을 수 있게 만든 기존 캐릭터의 동작 확장이다. v51 소스 커밋은 `155b05a84b92c445bc454413ce5e4353556977ca`다. 사용자가 [검토본을 선택하고 기본 자산 등록과 게시를 승인했다](approval.json).

## 원화와 파생 프레임

- [원화 기록](sources.json)에 ImageGen 원본 PNG 10장과 요청문, 참조 파일 및 SHA-256을 보존했다. 각 원본은 두 의상 중 하나의 네 방향 키포즈를 담는다.
- 기존 서기, 착석 유지, 공통 얼굴·헤어, 고해상도 걷기 64프레임을 재사용했다. 달리기는 방향·의상별 원화 키 4개와 파생 중간 키 4개를 사용한다. 무릎, 팔 위치, 발 높이, 옷의 접점을 기준으로 다른 파생 프레임도 조립했다.
- 기본 컬러와 노멀의 논리 셀은 64×80이다. 걷기 컬러는 기존 192×240 셀을 그대로 읽고 새 노멀도 같은 크기로 저장한다. 노멀은 실루엣과 표면 굴곡에서 오프라인으로 생성하며 각 레이어의 투명 마스크와 함께 패킹한다.
- 실제 캠퍼 렌더러는 검토용 매니페스트가 전달되면 프레임에 맞는 컬러·노멀을 불러온다. 착석 시작·종료와 들어 올린 상대를 던지는 순간은 화면에 표시할 상태 전환으로 따로 추적한다.

## 재현과 검토

`web/`에서 `npm run sprites:camper -- --check`로 등록된 아틀라스 바이트와 동작·노멀 검사를 재현한다. 아래 명령은 기본 자산에 등록하기 전의 후보 검토 순서다.

```sh
npm run sprites:camper -- build-motion motion-full-v1
npm run sprites:camper -- check-source motion-full-v1
npm run sprites:camper -- coverage motion-full-v1 --full
npm run sprites:camper -- review motion-full-v1 before --browser
npm run sprites:camper -- review motion-full-v1 after --browser
npm run sprites:camper -- verify motion-full-v1 --full
npm run sprites:camper -- review motion-full-v1 compare
```

브라우저 비교에는 기존 루프백 QA 앱과 일회용 헤드리스 브라우저가 필요하다. 후보 검토에서는 같은 게임 렌더러의 동작 장면과 좌·우·꺼짐 조명 비교에 새 자산을 주입했다. 등록본은 `npm run test:browser:camper-head`로 실제 게임 화면과 로비·프로필을 검사한다.

v52의 등록본은 기존 추출 좌표로 재현한다. 새 후보에서 [추출 레이아웃](source-layout.json)을 사용하면 던져지는 재킷 원화의 마지막 줄에서 실루엣 사이의 투명 구간으로 경계를 옮긴다. [포즈별 분리선과 손 경계](../../../../web/scripts/camper-pose-collars.mjs)는 손과 소매를 원화에서 분리해 몸 레이어에 남긴다. 조립 시 실제 목과 허리 위치를 사용하며, 들기·던지기 재킷의 천은 기본 팔레트에 맞춘다. 원본 PNG는 그대로 사용한다. 새 후보의 전체 검증에는 [원화·파츠·합성과 복합 동작 관찰](../../../../docs/art/scene-first-review.md#캠퍼-동작과-노멀-검수)이 추가된다.

후보 `4c9de38c96454e0ab5a94df5ad59e5d0f5d60c9b0d2447bc2b535b8429585b83`에서 명세 744조합의 누락·중복·노멀 정합 지적은 0건이다. Canvas 전후 48쌍, 브라우저 전후 65쌍을 확인했다. 브라우저 쌍 중 23쌍은 WebGL 동작 및 조명 비교다. 검토 결과는 `web/outputs/camper-harness/motion-full-v1/review/comparison.html`에 있다.
