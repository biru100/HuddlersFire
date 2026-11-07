# NW Idle v2 수신 검증

- 수신 원본: AgentHub Image #1, SHA256 `c9779f37594fbaad5dccc25e7cde64d20172cd743d619de3f6ad2144e47e70b0`, 915,804 bytes.
- PNG 실제 디코딩·RGBA/투명 영역 확인, 1254×1254 / 627×627의 2×2 셀 확인.
- 새 NW motion-lookdev의 부모는 기존 검증된 NW 디자인 `c1d4…`다. 승인된 디자인·v1 원본/리뷰를 덮어쓰지 않았다.
- source-registry API 및 CLI의 NW 단독 ingest/verify로 수신 원본·저장본·job 원본의 동일 바이트를 확인했다. 미수신 SE v2는 등록하지 않았다.
- 발점 자동 분할이 붙은 윤곽을 오인해, 원본 위 마커와 대조한 측정 분할 열 x=340을 명시했다. `--foot-split 340`은 측정 영역만 나누며 원본 픽셀·알파·위치를 바꾸지 않는다. 이 옵션을 JSON과 HTML에 공개했다.

| 실제 실행 | 결과 |
| --- | --- |
| `npm.cmd run test:art-source-registry` | 11/11 PASS |
| `npm.cmd run test:motion-lookdev` | 14/14 PASS |
| `npm.cmd run test:art-direction` | 34/34 PASS |
| `npm.cmd test` | 321/321 PASS |
| `npm.cmd run test:sprites:pipeline` | 96/96 PASS |
| typecheck / build | PASS / PASS |
| lint | 오류 0, 기존 경고 4개 |
| NW v2 headless desktop/mobile | 원본 8개 이미지 로드, 네 컷 가로 배치, overflow 없음, 4→1 재생, 발중점 고정·명암 바탕, JS 오류 0 |
| 첨부·레지스트리·motion job PNG | SHA256 일치, 무손실 보존 |
| GitHub PNG 원격 재다운로드 | commit `8ea406c95aadfd409a1233b216c74fb7dfd088e0`, HTTP 200, SHA256·915,804 bytes 일치. [검증 기록](../../../art/sprites/source-registry/rounded02-idle-motion-02-nw/REMOTE_VERIFICATION.json) |
| 기존 보호 원본·후보·정책·런타임 164개 | 작업 전 보존 기록과 raw SHA256 동일 |

부분 테스트는 전체와 중복된다. 기존 보호 해시 비교는 v1 검토 묶음의 preservation.json을 사용했다. vinext의 라우트 분류 안내와 기존 lint 경고는 실패가 아니다. 로컬 로그는 `outputs/idle-v2-*.log`에 보존한다. GitHub CI와 원격 재다운로드 결과는 PR의 해당 실행·검증 기록과 구분한다.

## 하네스 수정

- `art-source-registry.mjs`: 기존 version 1 NW/SE 쌍 계약은 유지하고, version 2에서는 **pending 모션 revision에 한해** 한 방향 수신을 지원한다. revision/파일명 일치, 중복/추가 슬롯 거부, 모션 승인 false를 검사한다. 디자인 승인 게이트를 변경하지 않는다.
- `motion-analysis.mjs` 및 inspect: 필요 시 명시적인 이미지 열 분할을 기록하고 사용할 수 있다. 자동 추정값과 작업자가 확인한 값을 구분한다. 공용 HTML에 v1을 고정 표시하던 제목도 수정했다.
- 추가 회귀: NW 또는 SE 단독 수신·원본 불변, 승인 상태로의 변조 거부, 중복/버전 파일명 오류 거부, 기존 쌍 계약 유지, 명시적 발 분할의 범위·원본 불변 검사.
- headless 검사에는 대상 폴더/방향 환경 변수를 추가해 NW v2를 기존 방식으로 검증했다. 개인 브라우저·운영 사이트는 조작하지 않는다.

모션 `decision:pending`, `artApproved:false`, `animationApproved:false`, `productionReady:false`, `runtimeVerified:false` 유지. 자연스러운 호흡·캐릭터 매력·최종 모션 품질은 Codex가 승인하지 않았다. SE v2 미수신. 네이티브 변환·알파 이진화·게임 자산 교체·배포는 하지 않았다.
