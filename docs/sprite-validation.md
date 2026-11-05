# INT-17 일러스트 재구성 검증 · 2026-11-05

**후속 배포:** 사용자 “배포해줘” 승인으로 공개 버전 **28·규약 v18**에 반영했다. 공개 파일 72개(스프라이트 22개 포함)와 입장 API 확인 PASS. 아래 미배포 설명은 초기 구현 검증 당시의 기록이며 현재 공개 결과는 [배포 검증 기록](validation.md)을 따른다.

사용자 “계획대로 구현” 승인 범위의 로컬 코드·자산·UI·제작 경로다. 공개 배포·커밋·푸시는 하지 않았다. 작업 시작 때 이미 존재한 변경을 보존했으며 Git HEAD 전체 diff를 이번 작업 단독 변경으로 해석하지 않는다.

## 제작과 산출물

- sprite-gen 3.15.0 / `4f5ccd55c7cf06685a41f954acc1e476b7772ece`, 프로젝트 로컬 Python 3.13.14, Pillow 12.3.0, NumPy 2.5.4.
- 내장 image_gen의 원본 20 PNG, 19,941,409 bytes. 캐릭터 16상태·63프레임, 시설 16종·효과 12종, grass/sand/stone. `art/sprites/source-manifest.json`에 SHA-256과 recipe를 기록한다.
- `node tools/rebuild-sprites.mjs` PASS. 별도 `art/sprites/runs/rebuild-1793879749592`에서 원본을 다시 prepare/extract/compose/slice/tile/build했다. extract 오류·경고 0, 63프레임 합성 성공, 지형 x/y 6개 검사 PASS. prepare의 중복 fit 설정/미사용 description 안내는 추출 오류와 구분한다.
- 최종 PNG **22개 / 9,181,523 bytes**. 컬러 캠프/놀이터 준비량 **5,273,793 bytes**, 컬러 전시장 **5,231,157 bytes**. 다크는 약 3.81~3.83 MB. 한 장면 RGBA 면적 합 약 44 MB는 브라우저 실제 메모리 측정이 아니다. decoded 캐시는 16개로 제한한다.
- 공식 exact recolor의 색별 전체 atlas 순회가 느려 중단하고 동일 명시 RGB map의 앱 단일 순회 어댑터로 대체했다. 공식 recolor 결과라고 표기하지 않는다. alpha 보존 검사 통과.
- 최종 투명 carry strip, 63개 프레임 contact sheet, 사진 합성, 컬러/다크 혼합 자세를 직접 확인했다. 상하체의 직선 절단은 곡선 허리 마스크로 수정하고 carried loop의 시각 고정도 수정했다. 효과/불꽃은 정적 PNG 변환 애니메이션이며 별도 다중 프레임 atlas가 아니다.

## 실행 결과

| 검사 | 결과·범위 |
| --- | --- |
| 변경 전 `npm.cmd test` | 183 PASS |
| 최종 `npm.cmd test` | **188 PASS**. 기존 물리·좌석·맵·입력·사진·음악·규약/복구 + 자산/프레임/로더 검사 |
| `npm.cmd run test:render` | PASS. 3맵·모바일·사진·포탈/부스·이름표·reduced-motion·6/16인 탑·불 외형 Canvas 직접 렌더 |
| `node --import ./tests/sprite-fixture.mjs tests/render-sprite-frames.mjs` | 전체 프레임 2장·컬러/다크 혼합 자세 sheet 생성·육안 확인 |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | 최종 PASS |
| `npm.cmd run lint` | 오류 0, 기존 `camp-world.mjs` 미사용 COLORS 경고 1 |
| `test:browser:appearance` | 격리 headless Chromium 데스크톱/모바일: 로비·입장창·5탭·초안·패널 크기·모달 포커스·테마 저장/재로드·자산 준비 PASS |
| `test:browser:community` | 입장/초대·좌석/불·개인 숨김·맵 이동·대화/스크롤·설정·필드/음악 PIP·방 종료 복구 PASS. YouTube는 stub |
| `test:browser:exhibition` | 데스크톱/모바일 실제 포탈 이동·두 부스·E/터치·공식 이미지·트레일러 URL·SNS·포커스/입력 잠금 PASS |
| `npm.cmd run test:network` | **16인 loopback RTC PASS**, 들기/공중/장난감·소실/재정렬·재연결·정상 종료/충돌/상태 소실/스케줄러 지연에 따른 승계·대화/음악/불 복구. 1,583 HTTP 요청 |

초기 회귀 실패는 기존 1.3 들기 간격과 부스 썸네일 위치의 고정 기대값이었다. 새 `CARRY_GAP=1.65`와 실제 표시 위치를 기준으로 수정했다. 스택 선택 검사는 6/16명 모두 통과했다. 공유 물리 변경은 v18로 구분하고 필드 배열/DB 스키마는 유지한다.

브라우저 최초 sandbox 실행은 `Runtime.enable` 시간초과, 로컬 Worker 최초 실행은 상위 경로 읽기 제한으로 실패했다. 격리 테스트/loopback Worker만 제한 해제해 완료했으며 개인 브라우저·데스크톱 앱을 조작하지 않았다. 최종 재빌드는 실행 중 Worker의 dist 잠금으로 EPERM이 났고 해당 Worker 종료 후 통과했다. 테스트용 로컬 프로세스는 종료했다.

브라우저 검사 이후의 게임 변경은 carried loop 시각/곡선 허리 마스크·전시장의 불필요한 sand 요청 제거이며 최종 단위/Canvas/typecheck/build로 확인했다. metadata builder의 마지막 실행은 source SHA-256 기록을 추가했고 앱 PNG/manifest는 동일했다.

## 비용과 한계

동일 1050×824·16명·각 맵/테마 30프레임 예열 후 180프레임 CPU Skia Canvas 측정이다. 원본 수치는 `web/outputs/sprite-render-baseline.json`, `sprite-render-after.json`에 남겼다.

| 맵 | 이전 중앙값 컬러/다크 | 새 중앙값 컬러/다크 | 새 p95 컬러/다크 |
| --- | --- | --- | --- |
| 캠프 | 1.46 / 1.52 ms | 4.19 / 4.13 ms | 5.41 / 5.09 ms |
| 놀이터 | 1.14 / 1.11 ms | 4.00 / 3.85 ms | 5.52 / 4.86 ms |
| 전시장 | 1.11 / 1.19 ms | 3.92 / 3.85 ms | 5.41 / 5.32 ms |

새 bitmap으로 전송량·렌더 비용은 증가했다. 준비된 이미지의 CPU 비교이며 최초 네트워크 로드, 브라우저 GPU FPS, 모바일 실기기 메모리/성능을 증명하지 않는다. Node loopback 입력→관찰 장비 변경은 p50 68ms / p95 83ms였고 렌더는 제외한다. 실제 외부 NAT·Discord 동의·YouTube 스트리밍/음향·실물 터치 키보드·커뮤니티 미감 선호는 별도 확인 범위다. 짧은 생성 pose loop의 프레임과 화면을 확인했으며 보간/골격 애니메이션 품질로 표현하지 않는다.

주요 이미지: `web/outputs/seed-lobby-desktop.png`, `seed-room-mobile.png`, `showroom-booth.png`, `sprite-frames-1.png`, `sprite-frames-2.png`, `sprite-combined-poses.png`, `camp-chain-16.png`. 제작 지침·툴/앱 경계는 [자산 계약](sprite-assets.md), 로컬 스킬은 [camp-sprite-assets](../.agents/skills/camp-sprite-assets/SKILL.md)에 있다.
