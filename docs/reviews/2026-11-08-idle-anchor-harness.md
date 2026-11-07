# Rounded 02 Idle · anchor 프레임 하네스 개편 검증

2026-11-08. 시작 브랜치 `art/rounded02-idle-review-20261108`, HEAD `d3dc5d773655976e1def9f4fe08d3625eb19b8ab`. 기존 PR #7은 open/unmerged였고 main은 `87dd4968596efc98f01529c736b5099503e0f93a`였다. 기존 코드를 이어 수정했으며 새 PR·병합·공개 배포는 하지 않는다.

## 구현 결과

| 파일/범위 | 변경 이유 |
| --- | --- |
| `tools/idle-frames.mjs` | 실제 같은 방향 디자인 부모·고정 f1 → 플랜 확인 → f2/f3/f4 개별 원본 수신 → 검사 → 마지막 조립. 불변 해시·출처·승인 경계 유지 |
| `tools/lib/idle-contract.mjs` | version 3 pending-only 프레임 inventory. 실제 수신한 슬롯만 등록 |
| `tools/lib/idle-checks.mjs` | 허용 영역 외 전부 잠금, 신발/하체 이동, 부위 예산, 내부 정지/2→3 급변/4→1, morph 요약. 원본 위치 보정 없음 |
| `tools/lib/idle-png.py` | 기존 고정 Pillow로 실제 RGBA PNG 디코딩과 마지막 2×2 위치 배치. alpha·숨은 RGB·동일 색 프로필 유지, 셀 전체 RGBA 재대조 |
| `tools/art-source-registry.mjs` | 기존 version 1/2 계약 유지, version 3 원본 슬롯·해시 검증 추가 |
| `tools/motion-lookdev.mjs`, 과거 준비 helper/테스트 | 신규 전체 시트 prepare는 기본 거절. 명시적 legacySheet/`--legacy-sheet`로 과거 재현 유지. 기존 prompt/load/inspect는 그대로 |
| `art/sprites/source-registry/rounded02-idle-frames-nw-01/` | 실제 승인 NW 원본·부모 job·초안 플랜·프레임 요청서·대기 보고서와 오버레이. 새 f2/f3/f4·최종 시트 없음 |
| AGENTS, 프로젝트 로컬 스킬 4개, 의도/구조/시각 제작/브리프/레지스트리 문서 | anchor 기반 개별 생성 기본 경로, ChatGPT/Codex/사용자 책임, 과거 시트와 신규 작업 구분 |
| `web/tests/idle-frames.test.mjs`, `browser.idle-frames.mjs`, lineage 회귀와 package scripts | 실제 PNG/부모 복원, 무손실 조립과 차단 조건, 원본 HTML 표시·루프 UI 검증 |

[실행 절차 및 ChatGPT 입력](../briefs/rounded-02/idle-frame-workflow.md), [NW 준비 폴더](../../art/sprites/source-registry/rounded02-idle-frames-nw-01/README.md)를 사용한다.

## 실제 원본과 승인 보존

NW anchor는 기존 승인 디자인 `nw-approved.png`와 **동일한 521850 bytes**, 1086×1448 RGBA다. SHA256은 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`. 실제 부모 fingerprint `28997cf1f92a45bf394bb298792be0fccf4bbf34210ab747139cb3368766406a`를 기존 `verifyArtReview`로 재확인한다. SE 부모·원본·선택 기록도 보존했다. SE 프레임 작업은 아직 준비하지 않았다.

새 NW 플랜은 DRAFT다. 사용자 디자인 선택을 neutral motion anchor/부위 플랜 확인으로 확대하지 않는다. **실제 ChatGPT 확인이 없어 confirmation.json은 없다.** f2/f3/f4가 없으므로 `awaiting_frames`, `assemblyReady:false`이며 재생 버튼도 비활성이다. 미술 평가·호흡 가독성·사용자 모션 선택은 unreviewed/pending이다.

신규 작업의 `artApproved`, `animationApproved`, `productionReady`, `runtimeVerified`는 모두 false, `decision:pending`, `reviewState:pending-motion-review`다. native 64×96·알파 이진화·양자화·자동 반전·게임 교체는 하지 않았다. GIF는 팔레트/반투명 변환이 필요하므로 원본 PNG 기반 HTML 루프로 대체했다.

원본에는 반투명 외곽과 낮은 알파의 넓은 fringe가 있다. full bounds와 alpha≥128 core bounds를 구분한다. 발 위치도 alpha≥128 최하단 행의 **이미지 좌표 proxy**이며 측정 임계값일 뿐 원본 알파 변환이 아니다. 해부학적 발 접점/카메라/방향/미술적 모션 품질을 기술 점수로 통과시키지 않는다.

중단됐던 NW 후보 05의 로컬 PNG·registry/job·검토 자료와 root `.gitattributes`의 해당 변경은 그대로 남겼다. 이번 개편 커밋에 포함하거나 업로드/승인 완료로 처리하지 않는다. 다른 untracked incoming 폴더도 보존한다.

## 실행 검증

| 명령 (`web/`) | 실제 결과 |
| --- | --- |
| `npm.cmd test` | **337/337 PASS**, 실패 0·skip 0 |
| `npm.cmd run test:sprites:pipeline` | **112/112 PASS**, 실패 0·skip 0. 기존 registry 11·motion/analysis/lineage 14와 새 프레임 16 포함 |
| `npm.cmd run test:art-direction` | **34/34 PASS**, 기존 정책·승인 fingerprint 코드 변경 없음 |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개 (`camp-camera`, `camp-canvas-renderer`, `camp-renderer`, `camp-world`) |
| `npm.cmd run build` | PASS. 기존 vinext route classification / plugin timing 안내 유지 |
| `npm.cmd run test:render` | 기존 Canvas 장면 35개 PASS. 데스크톱/모바일 크기·세 맵·사진/표시·행동·무기·좌석/이름표 등. 실제 WebGL/실기기 검사는 아님 |
| `npm.cmd run test:browser:idle-frames` | 격리 headless PASS. 실제 NW 원본 decode·desktop/mobile 배치·초안 오버레이 on/off·명암·64×96 표시·누락 프레임 재생 차단. 테스트용 기하 PNG로 4→1 UI 재생 확인. JS 오류 0 |
| Node syntax / Python AST / registry verify / `git diff --check` | PASS |

최초 headless 실행은 샌드박스 CDP `Runtime.enable` 시간 초과로 실패했다. 사용자 UI를 조작하지 않는 동일 격리 검사를 허용된 일반 실행 권한으로 재실행해 통과했다. 추가 경로 이탈 회귀 작성 중 Windows 빈 디렉터리 정리에서 `rmSync` EISDIR가 났고, 비재귀 `rmdirSync`로 고친 뒤 전체 337/337와 pipeline 112/112를 재실행해 통과했다. 최신 morph 요약은 보이지 않는 RGB 변경도 raw/visible 수치를 구분하며 관련 프레임 회귀를 다시 확인한다.

새 검사에는 고정 신발/잠금 영역/숨은 RGB 변화 거절, 전신 이동 진단, 부위 모핑 예산·내부 정지·전환 급변·4→1 seam 거절, 잘못된 부모/anchor/캔버스/출처/중복/오래된 플랜·receipt/리포트 거절, job 밖 연결 디렉터리 쓰기 거절, 모션 승인 확대 거절, 반투명·숨은 RGB까지 무손실 조립과 색 프로필 불일치 거절을 포함한다. 테스트 기하 이미지는 실제 캐릭터 원화가 아니다.

기존 `web/public`, `web/lib`, `tools/lib/art-direction.mjs`, 미술 정책, 승인 디자인·Idle 원본 레지스트리 및 v1–v4 검토 묶음은 시작 HEAD 대비 `git diff --exit-code`로 변경 없음을 확인했다. 네트워크/실인터넷/NAT·실기기 게임 검사는 이번 변경 범위가 아니며 미실행이다. 게임 미술·새 실제 애니메이션 루프 검증을 완료로 주장하지 않는다.

## 남은 실제 제작

1. ChatGPT가 f1 neutral 용도·초안 영역/예산/250ms 타이밍을 검토한다. 수정이 필요하면 새 set으로 준비한다.
2. 확인된 같은 f1과 플랜으로 f2 inhale / f3 exhale / f4 return **각각 하나의 원본 PNG**를 생성한다. 현재 필요한 파일은 `frame02-inhale.png`, `frame03-exhale.png`, `frame04-return.png`다.
3. Codex가 원본·SHA·출처를 등록하고 여섯 기술 체크와 명암/작은 표시/루프를 검토한다. 실패는 자동 위치 보정·마스크 복사·축소/양자화로 숨기지 않는다.
4. 기술 통과 후 마지막 참고 조립 → ChatGPT 미술 평가 → 사용자 모션 선택. SE는 독립 anchor와 영역 플랜으로 진행한다. native/runtime/게임 교체/공개 배포는 후속 별도 승인 단계다.
