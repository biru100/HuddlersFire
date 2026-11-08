# Rounded 02 Idle · anchor 기반 프레임 제작

> **최신 NW 검토:** [플랜 02 — 머리 전체 잠금·연결된 상체·1.9초·부분 원화 합성](idle-masked-upper-body-02.md)을 우선한다. f1 neutral 사용 가능만 전달됐고 수정 영역은 미술 재검토 대기다. 확인 전 confirm-plan을 실행하지 않는다. 아래 플랜 01의 머리 끝 허용/250ms 및 자동 마스크 합성 금지는 당시 전체 프레임 전달 방식의 이력이다. 플랜 02의 명시적 사전 마스크 선택은 원본/파생물·제외 변경·이음새를 따로 검증하며 실패한 전체 프레임 수리를 허용하지 않는다.

## Active core plan 03 (2026-11-08)

[Current preflight](idle-core03-preflight.md) is the new-job workflow. ChatGPT can perform artwork, review, repository changes and deterministic tests here; Codex is optional. Frozen CORE uses generated RGBA; guard/outside use f1. Raw discarded differences remain reported. Legacy plans are preserved. No main merge, game execution, runtime art replacement or deployment in this task.

2026-11-08 활성 절차. 이전 2×2 시트는 원본과 검토 기록을 보존하는 이력이다. **전체 시트 일괄 생성은 신규 기본 경로에서 제외**한다. 그림을 다시 만들기 전에 anchor·영역·프레임 의도를 고정한다.

## 책임과 현재 상태

- **ChatGPT:** neutral anchor 검토, 부위 경계·호흡 의도·예산 검토, f2/f3/f4 개별 원화 제작과 미술 평가.
- **Codex:** 동일 해시의 디자인 부모 연결, 원본 SHA256/PNG/RGBA 보존, 위치·부위·루프 기술 검사, 무손실 시트 조립. 승인 후 게임 연동·실행 검증은 별도 단계다.
- **사용자:** 실제 프레임 원본과 모션 최종 선택. 디자인 LOOKDEV 선택이 모션 선택으로 확대되지 않는다.

[기존 디자인 승인](../../reviews/2026-11-07-rounded02-rev2-art-approval.md)은 유지한다. 새 job은 항상 `pending-motion-review`, `artApproved:false`, `animationApproved:false`, `decision:pending`, `productionReady:false`, `runtimeVerified:false`다. `confirm-plan`은 **f1 neutral 용도와 영역·예산·타이밍의 실제 ChatGPT 검토 참조**만 기록한다. 모션 최종 승인이 아니다. 실제 검토 전에는 실행하지 않는다.

## 저장 구조

NW 실제 준비 폴더: [rounded02-idle-frames-nw-01](../../../art/sprites/source-registry/rounded02-idle-frames-nw-01/README.md). 승인된 디자인 PNG를 원본 그대로 복사해 f1 후보로 연결했다. 과거 시트의 f1을 잘라 쓴 것이 아니다. 새 f2/f3/f4는 아직 없다.

```text
art/sprites/source-registry/<fresh-view-set>/
  job.json                 # 실제 같은 방향 lookdev 부모·리뷰 fingerprint
  MANIFEST.json            # version 3; 실제 수신한 f1..f4만 등록
  SHA256SUMS.txt
  base/frame01-anchor.png  # 승인 디자인 원본 그대로; neutral 용도 확인은 별개
  motion-plan/
    REGION_LOCKS.md
    REGION_LOCKS.json      # 원본 좌표의 잠금 사각형·허용 다각형·변화 예산
    FRAME_INTENT.json
    f2-request.json / f2-request.txt   # f3, f4도 독립 요청
    confirmation.json      # 실제 ChatGPT 확인을 받은 후에만 생성
  generated/
    frame02-inhale.png / f2-receipt.json
    frame03-exhale.png / f3-receipt.json
    frame04-return.png / f4-receipt.json
  assembly/
    idle-4cut-reference.png # 기술 통과 후 마지막에 무손실 배치
    ASSEMBLY.json          # 파생물 해시·원본 해시·검사 보고서 해시
  review/
    alignment-report.json
    loop-preview.html      # 원본 PNG를 그대로 재생; 명암/64×96 표시/영역 오버레이
    art-review.md          # 실제 평가 전까지 pending/unreviewed
```

GIF 대신 HTML 루프를 사용한다. 팔레트 양자화·반투명 손실 없이 같은 원본 RGBA를 볼 수 있다. 64×96는 CSS 표시 가설이며 PNG 축소 납품이 아니다. 프레임이 없으면 재생 버튼은 비활성화된다. 같은 f1을 네 번 넣어 완성 루프처럼 보여 주지 않는다.

## 잠금과 프레임 의도

| 구분 | 규칙 |
| --- | --- |
| 잠금 | 두 신발 전체, 발바닥·뒤꿈치·발끝 접점, 무릎 아래, 전신 위치, 카메라·원근·방향 |
| 제한 허용 | 작은 가슴·어깨·후드 상단/입구·등 윗부분·일부 머리 끝·상완 미세 반응 |
| 기본 영역 | 명시적 허용 다각형 밖은 모두 잠금. 보이지 않는 가슴을 새로 그리지 않음 |
| f1 | neutral anchor. 원본을 수정하지 않음 |
| f2 | inhale. 작게 팽창하며 전신을 들어 올리지 않음 |
| f3 | exhale. f2에서 작게 이완. 반대 극점으로 크게 꺾지 않음 |
| f4 | return. f1에 접근하고 4→1도 일반 전환과 비슷한 크기로 연결 |

현재 NW 다각형과 예산은 **기술 초안**이다. 원본 좌표에서 오버레이를 보고 ChatGPT가 실제 부위를 확인해야 한다. f2/f3/f4는 모두 같은 f1에서 출발한다. 앞 생성본을 다음 프레임의 새 기준으로 삼으면 누적 모핑이 생긴다. 부위 변경이 필요하면 기존 플랜/승인 흔적을 덮어쓰지 않고 새 set을 준비한다.

## 실행 순서

처음 설치한 환경에서는 `node tools/setup-sprite-gen.mjs`로 기존 고정 Pillow 환경을 준비한다. 승인 부모 job이 없는 새 checkout은 `node tools/restore-rounded02-idle-review.mjs`로 **저장된 실제 승인 증거를 복원**한다. 이미 job이 있으면 복원하지 말고 기존 검증을 사용한다. 이 명령은 새 승인을 만드는 도구가 아니다.

새 방향/개정 작업을 만들 때:

```powershell
node tools/idle-frames.mjs prepare --out <새-set-id> --view nw --parent-job art/sprites/runs/lookdev-nw-rounded02-rev2-approved-20261108/job.json --parent-review art/sprites/runs/lookdev-nw-rounded02-rev2-approved-20261108/art-review.json --anchor art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png --plan docs/briefs/rounded-02/idle-nw-regions.draft.json --intent docs/briefs/rounded-02/idle-frame-intent.draft.json
```

1. ChatGPT에 실제 f1 PNG와 `REGION_LOCKS.md/json`, `FRAME_INTENT.json`, 영역 오버레이를 전달한다. neutral 용도·부위 경계·예산·타이밍 확인을 먼저 받는다. 수정이 필요하면 새 set으로 고친다.
2. 실제 확인 후 아래 참조를 실제 대화로 대체해 `confirm-plan`을 실행한다. **현재 NW는 미실행**이다.
3. `f2-request.txt/json`과 같은 f1·플랜을 보내 f2만 생성한다. f3와 f4도 각각 동일한 입력 묶음으로 독립 생성한다. 요청문만 보내고 원본 PNG를 누락하지 않는다.
4. 받은 원본마다 SHA256·출처·anchor SHA를 기록하고 독립 파일로 수신한다. 캔버스/원본이 다르면 자동 조정하지 않는다.
5. `inspect`로 모든 전환을 비교한다. 실패하면 ChatGPT에 원본·리포트·루프를 돌려주고 새 원화를 새 set으로 받는다. Codex가 위치/부위를 고쳐 통과시키지 않는다.
6. 네 원본이 있고 기술 기준을 모두 통과한 다음에만 `assemble`한다. **원본 크기 그대로** TL=f1, TR=f2, BL=f3, BR=f4에 배치하고 모든 디코딩 RGBA가 입력과 같은지 확인한다. 이 시트도 미승인 참고 자료다.
7. 원본/인계 자료를 GitHub에 커밋·푸시한 뒤 고정 커밋의 **원격 PNG 바이트 SHA256**까지 재검증한다. 매니페스트만으로 업로드 완료라고 하지 않는다. ZIP은 기본 인계에 사용하지 않는다.

```powershell
$job = 'art/sprites/source-registry/rounded02-idle-frames-nw-01/job.json'
node tools/idle-frames.mjs confirm-plan --job $job --reference '실제 ChatGPT neutral·영역·예산·타이밍 확인 출처'
node tools/idle-frames.mjs intake --job $job --frame f2 --source 'C:\originals\frame02-inhale.png' --source-reference '실제 f2 생성 대화' --anchor-sha c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a
# f3/f4도 각각 해당 frame과 원본을 지정한다.
node tools/idle-frames.mjs inspect --job $job
node tools/idle-frames.mjs assemble --job $job
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-idle-frames-nw-01/MANIFEST.json
```

위 마지막 조립은 현재 f2/f3/f4·실제 플랜 확인이 없어 차단된다. SE는 같은 도구로 준비하되 **SE 원본·SE 승인 부모·SE용 독립 영역 플랜**이 필요하다. NW 플랜을 반전/재사용하지 않는다.

## 기술 검토 기준

| 검사 | 측정 / 차단 |
| --- | --- |
| 원본/부모 | SHA256·바이트·실제 RGBA PNG 디코딩·동일 캔버스·리뷰 fingerprint·출처. 원본/플랜/요청문/receipt 변조나 누락 차단 |
| global translation | 잠근 하체에서 이동 추정, 허용 0px. 위치를 보정하지 않음. 회전/원근은 추정 통과로 승인하지 않음 |
| foot lock | 각 신발 보호 영역의 원본 RGBA 변화 0px, 최하단 알파 행/contact span 기술 proxy. 실제 접점 해석은 미술 검토 |
| locked consistency | 허용 영역 밖 원본 RGBA 변화 0px. 완전 투명 픽셀의 숨은 RGB도 보존 |
| motion budget | f1 대비 각 허용 영역의 변경 비율·premultiplied RGBA 평균 오차. 초안 예산 초과 시 차단 |
| rhythm | 네 전환의 RGBA 오차/프레임 표시 시간 비교. 기본 최대/최소 비율 1.6, f1→2→3→4의 정지 전환 차단. f4=f1의 0 seam은 허용 |
| 4→1 | seam 변화율/다른 세 전환 평균 ≤1.25. f4가 두 peak보다 anchor에서 멀면 차단 |
| morph summary | 잠금 변경·예산 초과 부위 요약. 동일 인물/옷의 미술적 일관성·호흡 가독성은 unreviewed |
| 조립 | 네 실제 원본, 확인된 플랜, 최신 검사 통과 필요. PNG 색 프로필 불일치 차단. 원본 RGBA/반투명/숨은 RGB 무손실 배치 검증 |

예산은 해상도와 부위에 따른 **임시 수치**이지 좋은 호흡을 보장하는 점수가 아니다. 픽셀 일치 조건을 생성기가 달성하지 못하면 기술적으로 차단하고 그 한계를 보고한다. 소스 자동 마스킹 합성으로 부위 실패를 숨기지 않는다. 이번 단계는 native 64×96/알파 이진화/게임 교체/공개 배포를 포함하지 않는다.

## ChatGPT 입력 형식

실사용 입력은 NW 폴더의 `motion-plan/f2-request.txt`와 같은 프레임별 JSON이다. 사용자 설명을 임의 승인으로 쓰지 않는다. 텍스트를 아래처럼 시작하고 **실제 파일들을 첨부**한다.

> Rounded 02 NW Idle의 f2 inhale 하나만 생성해 주세요. 첨부 f1 PNG가 고정 기준이며 anchor SHA와 플랜 SHA는 동봉 JSON 값입니다. REGION_LOCKS 바깥 픽셀, 두 신발 전체, 무릎 아래, 전신 위치, 카메라/원근/방향은 유지하세요. 확인된 상체의 작은 부위에서만 호흡을 표현하세요. 전체 2×2 시트를 만들지 마세요. f3 exhale과 f4 return도 이후 같은 f1에서 각각 요청합니다. 네 전환 중 2→3이 유독 커지지 않게 유지하고, f4는 f1에 가깝게 돌아오도록 설계하세요. 고정 보존이 불가능하면 성공으로 표시하지 말고 한계를 알려 주세요.

```json
{
  "workflow": "anchor-frame-by-frame",
  "view": "nw",
  "frame": "f2",
  "intent": "inhale",
  "anchor": {"file": "base/frame01-anchor.png", "sha256": "c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a", "canvas": [1086,1448]},
  "lockedPlanSha256": "동봉한 f2-request.json의 실제 값",
  "frameIntentSha256": "동봉한 f2-request.json의 실제 값",
  "output": {"filename": "frame02-inhale.png", "format": "single-frame RGBA PNG", "canvas": [1086,1448], "background": "transparent", "sheet": false}
}
```

f3는 `frame:f3`, `intent:exhale`, `frame03-exhale.png`; f4는 `frame:f4`, `intent:return`, `frame04-return.png`다. SHA와 기준 입력은 동일하다. GitHub에 직접 PNG 바이너리를 올릴 수 없으면 다운로드한 **실제 원본 파일**을 Codex에 첨부하거나 로컬 전체 경로로 전달한다. 스크린샷/비교판/미리보기 재저장은 원본을 대신하지 않는다.
