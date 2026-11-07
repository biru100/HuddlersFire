# 실행·보존 검증

기준 main 작업 시작 HEAD: `87dd496`. 기존 로컬 incoming 세 묶음과 다른 해시의 Rev2 job은 보존했다. 새 아트 디렉션 정책이나 승인 fingerprint 형식을 만들지 않고 기존 게이트로 정확한 두 부모를 검증했다.

| 실제 실행 | 결과 |
| --- | --- |
| 두 source-registry `verify` | 원본 네 장 SHA256·바이트·PNG 크기 일치 |
| 부모 NW/SE `review-sprite-job.mjs` | 각각 LOOKDEV `artApproved:true`, `productionReady:false`, `runtimeVerified:false` |
| 두 `motion-lookdev prepare → intake → inspect` | 방향별 부모 참조·원본 무손실 수신·측정 자료 생성, 모션 pending |
| `npm.cmd run test:motion-lookdev` | **13/13 PASS**: 기존 모션 6 + 측정 6 + 실제 증거 복원 1 |
| `npm.cmd run test:art-direction` | **34/34 PASS** |
| `npm.cmd test` | **317/317 PASS** |
| `npm.cmd run test:sprites:pipeline` | **92/92 PASS** |
| `npm.cmd run typecheck` / `npm.cmd run build` | PASS / PASS |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개 |
| `npm.cmd run test:browser:motion-review` | NW/SE desktop/mobile HTML PASS: 원본 8개 이미지 로딩, 네 컷 가로 배치, overflow 없음, 4→1 재생, 발중점 고정, 명암 바탕, JS 예외 0 |
| 별도 빈 root로 실제 evidence 복원 | 부모 2/모션 2 재검증, pending 유지, 재실행 덮어쓰기 거부 |
| 기존 보호 파일 작업 전후 raw SHA256 | 모두 동일, [preservation.json](preservation.json) |
| main 대비 art-direction 코드/정책·앱·런타임 이미지 | 변경 없음 |
| `git diff --check` | PASS |

테스트 수는 중복되므로 합산하지 않는다. npm의 전체 회귀에는 기존 Canvas 자산/게임 계약 검사가 포함된다. 새 실제 게임 장면·실물 기기·공개 호스트·RTC 회선 검증은 이번 단계에 수행하지 않았다. headless 검사는 격리 프로필에서 로컬 검토 HTML만 연 것이며 개인 브라우저 UI 조작이 아니다.

첫 headless 시도는 제한 환경에서 `CDP timeout Runtime.enable`로 실패했다. 같은 로컬 HTML 검사를 제한 밖 임시 프로필로 재실행해 통과했다. 화면을 직접 확인한 뒤 네 컷이 한 줄에 들어가도록 레이아웃을 고치고 다시 통과시켰다. 빌드의 vinext 라우트 자동 분류 안내와 lint의 camera/canvas-renderer/renderer/world 기존 경고는 실패가 아니다.

## 의미 있는 추가 회귀

- 알려진 평행이동의 bbox·몸 중심·발 proxy·정합 결과를 확인하고 원본 배열 불변을 검증한다.
- 평행이동과 국소 형태 변경의 잔여 오차를 구분한다.
- alpha=0 숨은 RGB는 차이로 오인하지 않으며, 이동 후 셀 밖으로 나가는 가시 픽셀도 비교에서 누락하지 않는다.
- 희미한 alpha 경계와 실제 캐릭터 잘림을 분리한다. 분석 threshold를 PNG 이진화로 저장하지 않는다.
- 4→1을 포함한 비교, 단일 원본 시트의 CSS 창 7개, pending/타이밍 가설을 검증한다.
- 실제 저장된 디자인 승인 증거를 임시 root로 복원하고 기존 승인 게이트를 통과한다. 모션 승인 내용을 만들지 않으며 같은 job의 덮어쓰기를 거부한다.

## 변경 이유

- `tools/lib/motion-analysis.mjs`: 프레임 기하·발/몸 중심 proxy·원시/정합 후 픽셀 차이·loop seam과 비파괴 인터랙티브 검토 HTML.
- `tools/motion-lookdev.mjs`: 기존 `inspect`에 새 분석 산출물을 연결한다. 부모 승인 게이트·원본 수신 규칙은 그대로다.
- `tools/prepare-rounded02-idle-review.mjs`: 승인 문서의 실제 여섯 평가/선택을 정확한 새 부모에 연결한 이번 작업의 실행 절차. 기존 job/검토 묶음이 있으면 중단한다.
- `tools/restore-rounded02-idle-review.mjs`: Git 제외 대상 runs를 새 clone에서 저장된 증거·레지스트리 원본으로 복원하고 기존 게이트로 검증한다. 새 승인 생성 경로가 아니다.
- `web/tests/motion-analysis.test.mjs`, `rounded02-lineage.test.mjs`, `browser.motion-review.mjs`, npm scripts: 위 오류·유실·승인 혼동을 회귀 검사한다.
- `.gitattributes`: 증거 텍스트 LF, 검토 화면 PNG binary 보존. PNG 원본 레지스트리 규칙은 유지한다.
- 관련 스킬·브리프·의도 문서: 과거 원본 미수신/부모 차단을 이력으로 명시하고 실제 검토 경로를 안내한다.

로컬 로그: `outputs/rounded02-motion-tests.log`, `rounded02-art-tests.log`, `rounded02-full-tests.log`, `rounded02-pipeline-tests.log`, `rounded02-typecheck.log`, `rounded02-build.log`, `rounded02-lint.log`. 이 리포트는 로컬 실행 기록이며 GitHub CI 상태와 별개다.

## 남은 단계

ChatGPT가 두 리포트·루프를 평가하고 [Idle v2 요청서](IDLE_V2_REQUEST.md)로 새 원본을 제작한다. 사용자가 각 모션 후보를 실제 선택할 때까지 `decision:pending`, `artApproved:false`, `animationApproved:false`, `productionReady:false`, `runtimeVerified:false`를 유지한다. 네이티브 변환·알파 이진화·게임 원화 교체·배포는 이번 결과에 포함되지 않는다.
