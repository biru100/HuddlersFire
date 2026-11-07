# NW Idle 플랜 02 · 수정 영역과 부분 원화 합성 검증

2026-11-08. 시작 브랜치 `art/rounded02-idle-review-20261108`, HEAD `a412a47e08b9a3c8b67f20f02a724c5f7cb54062`. 기존 PR #7을 이어 사용한다. 사용자 전달은 **기존 승인 NW 디자인의 f1 neutral 사용 가능**이며, 수정 플랜의 실제 미술 검토 전 `confirm-plan`을 실행하지 말라는 제한을 포함한다.

## 결과와 실제 상태

[NW 준비 폴더 02](../../art/sprites/source-registry/rounded02-idle-frames-nw-02/README.md)에 같은 승인 원본을 무손실 복사했다. SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`, 521850 bytes, 1086×1448 RGBA다. 기존 부모 lookdev의 실제 승인 fingerprint를 유지한다.

[실제 사용자 전달 기록](2026-11-08-nw-neutral-anchor-review.json)은 원문 한 문장과 `reportedBy:user`, `scope:f1-neutral-only`를 명시한다. 새 ChatGPT 평가 내용이나 URL·모션 선택을 만들지 않았다. **수정 영역/마스크/경계/예산/타이밍 확인은 아직 없다.** 실제 job에 confirmation.json은 없고 generated/composites/assembly의 PNG도 없다. `artApproved:false`, `animationApproved:false`, `decision:pending`, `productionReady:false`, `runtimeVerified:false`, `pending-motion-review`다.

수정 플랜은 곱슬머리 전체를 보수적 상단 잠금 띠로 보호하고, 목 아래·어깨·후드·등 위를 하나의 연결된 허용 다각형으로 제안한다. 목표 주기는 1.8~2초, 초안은 475ms×4=1900ms다. 영역·해부학적 연결·변화 예산·경계 띠/미술적 이음새는 ChatGPT가 다시 검토해야 한다. [플랜 검토 요청](../briefs/rounded-02/idle-masked-upper-body-02.md)과 원본/오버레이 PNG를 바로 전달할 수 있다.

## 합성 설계와 경계

사용자가 검토를 요청한 부분 원화 경로를 **명시적 job version 2 모드**로 구현하고, registry version 3/기존 job version 1은 유지했다. 기존 플랜 01의 원본/요청/리뷰는 변경하지 않았다.

- `C[p] = mask[p] ? generatedRGBA[p] : anchorRGBA[p]`. 사전 고정된 원본 좌표의 마스크로 네 채널을 그대로 선택한다. 새 색/알파를 만들거나 블렌딩·페더링·정렬·리사이즈·양자화·재작화하지 않는다.
- mask 데이터의 0/1은 선택 규칙이며 이미지 알파 이진화가 아니다. 마스크 SHA와 JSON 다각형 재계산을 대조한다. 실제 NW mask SHA는 `fefef5a715acfaaacd58c98a0a00b9b3e3d58cef1710791b58830d86665b4680`다.
- 마스크 안쪽 4px 문맥 띠는 **생성 원본 단계부터 anchor와 정확히 같아야** 한다. 불일치하면 원본·실패 리포트만 남기고 합성 PNG는 쓰지 않는다. 띠/내부 경계의 premultiplied 채널 gradient 변화도 예산으로 차단한다.
- 원본은 `generated/`+MANIFEST/SHA/receipt, 파생 PNG는 `composites/`+독립 SHA/provenance로 보존한다. 원본의 마스크 밖 제외 변화·bbox·보호 부위별 차이와 파생물의 해당 0변경을 나란히 보고한다. 합성 통과를 원본 전체나 미술 PASS로 해석하지 않는다.
- PNG decode 후 선택된 RGBA와 저장 파생물의 모든 RGBA를 대조한다. 마지막 시트는 원본 f1+실제 합성 f2/f3/f4를 입력으로 사용하고, 생성 원본 목록도 별도 기록한다.
- 플랜 확인·실제 원본·경계 기술 통과 전 `compose`/`assemble`는 차단된다. 실제 수정 플랜에는 confirm-plan을 실행하지 않았다. 테스트의 확인 기록과 합성은 격리된 **기하 fixture**에서만 수행했다.

## 변경 파일

| 범위 | 이유 |
| --- | --- |
| `tools/idle-frames.mjs` | job v2, f1 neutral 전달 기록 분리, 부분 원화 요청/수신 scope, `compose`, 원본/파생물 검증·미리보기·시트 입력 분리 |
| `tools/lib/idle-composite.mjs` | 고정 선택 마스크/문맥 띠, 원본/제외/보호 영역·파생 변경, gradient 검사. 그림 생성 없음 |
| `tools/lib/idle-checks.mjs` | 명시적 합성 계약·전체 머리 보호·1.8~2초 범위 검증. 기존 계약 유지 |
| `tools/lib/idle-png.py` | 원본 보존과 정확한 RGBA 선택 PNG 저장·재디코딩. 색 프로필 불일치 거절 |
| `art/sprites/source-registry/rounded02-idle-frames-nw-02/` | 새 원본 anchor/actual neutral 범위 기록·초안 플랜·동결 mask·요청서·대기 리포트·HTML/오버레이 캡처. 실제 모션 원화/합성은 없음 |
| `docs/briefs/rounded-02/idle-*-02*`, neutral 기록/현재 문서 | 수정 플랜과 미술 검토 입력·합성 제안/한계·실행 순서 |
| `AGENTS.md`, 프로젝트 로컬 스킬 4개 | 전체 머리 잠금·명시적 부분 원화 선택·실제 검토 전 confirm-plan 금지·승인 경계 |
| `web/tests/idle-frames.test.mjs`, lineage/browser 회귀 | 추가 8개 합성/승인/타이밍/마스크/경계 검사, 실제 새 job 복원, 플랜01·02 검토 UI |

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| `npm.cmd run test:idle-frames` | 24/24 PASS (기존 16 + 추가 8), 실패/skip 0 |
| `npm.cmd test` | 345/345 PASS, 실패/skip 0 |
| `npm.cmd run test:sprites:pipeline` | 120/120 PASS, 실패/skip 0 |
| `npm.cmd run test:art-direction` | 34/34 PASS. 기존 디자인 승인 코드/정책 fingerprint 유지 |
| `npm.cmd run typecheck`, `npm.cmd run build` | PASS |
| `npm.cmd run lint` | 오류 0, 기존 런타임 경고 4개 |
| `npm.cmd run test:browser:idle-frames` | 격리 headless PASS. 실제 플랜01·02의 anchor decode·desktop/mobile·오버레이·명암·작은 표시·누락 프레임 재생 차단, 테스트 기하 PNG 4→1 UI 루프, JS 오류 0 |
| Python AST, Node/registry 검사, `git diff --check` | PASS |

최신 UI 표시는 f1 사용 가능과 수정 영역/마스크/타이밍 미확인을 분리해 실제 검토 화면에서 재확인했다. 원본 영역과 합성 후보의 alt/제목·기술 보고서도 구분한다. [오버레이 PNG](../../art/sprites/source-registry/rounded02-idle-frames-nw-02/review/region-plan-preview.png)는 원화가 아닌 기술 검토 캡처이고 PREVIEW_ARTIFACT.json에 독립 SHA를 남겼다.

시작 HEAD 대비 기존 플랜 01, 승인 디자인 원본/문서, 과거 모션 원본·리뷰, 정책과 `art-direction.mjs`, `web/lib`/`web/public`의 변경 없음 및 새 job의 실제 confirmation/source/composite/sheet 부재를 확인했다. 중단된 로컬 후보 05·incoming 자료와 root `.gitattributes`의 기존 변경도 그대로 보존·커밋 제외한다. 이번에 새 게임 장면/네트워크/실기기 검사는 실행하지 않았으며, 이전 실행을 이번 PASS로 재사용하지 않는다. 새 원화 생성·실제 부분 합성·미술/모션 승인·native/runtime·게임 교체·병합/배포는 하지 않았다.
