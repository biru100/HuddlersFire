# Rounded 02 Rev2 · ChatGPT Idle 4컷 모션 시안 전달

> **GitHub-first 변경:** [Idle motion 원본 예정 경로](../../../art/sprites/source-registry/rounded02-idle-motion-01/README.md)로 원본 PNG를 직접 등록한다. ZIP 전달은 역사적 기록이며 현재 기본 경로에서 제외한다. 원격 PNG/SHA 검증이 끝나기 전에는 GitHub 업로드 완료라고 보고하지 않는다. 모션 승인/네이티브/런타임은 계속 대기다.

2026-11-07 기준. **캐릭터 NW/SE 착의 디자인은 사용자 미술 기준작으로 선택 완료**, 이 문서의 **4컷 Idle 모션은 별도로 미술 미승인** 상태다.

## 누가 제작하고 누가 검증하는가

- **ChatGPT 이미지 제작 대화:** 캐릭터 방향별 원화, 기본 신체 디자인, 동작별 프레임 이미지, 헤어·상의·하의 레이어 **원화 생성 및 미술적 검토**. 재제작 요청도 여기서 한다.
- **사용자:** 디자인/모션 시안을 원본 SHA256 단위로 최종 선택. 특정 캐릭터 디자인 승인과 애니메이션 승인, 실제 게임 배포 승인은 각각 별개.
- **Codex:** 원본 바이트 보존·SHA256, PNG 디코딩, 2×2 셀/프레임 정렬·접지·연속성·루프 진단, 네이티브 픽셀 계약 가능성 확인, 승인 후 게임의 애니메이션 설정/프레임 등록/검증. **Codex가 미술 원화를 코드로 그리거나 임의 생성·축소·반전하여 납품하지 않는다.**

## 이번에 ChatGPT에서 생성한 원본

| 방향 | 원본 저장명 | 전달 ZIP 속 파일 | SHA256 |
| --- | --- | --- | --- |
| NW 뒷사선 | `아늑한_꼬마_소년_4프레임_스프라이트시트.png` | `rounded02_rev2_idle_nw_motion_concept.png` | `7abce57cf6e2cd4a4f2611d9cabb652a40526b7faac26a229b4ba1aafa404581` |
| SE 앞사선 | `포근한_픽셀_소년의_숨결_애니메이션.png` | `rounded02_rev2_idle_se_motion_concept.png` | `1483c3c713929c407f0e427096d92dcf9b3fd0a995e08058369e4b3b792da929` |

각각 **1254×1254 RGBA PNG, 2×2 네 칸**이다. 컷 순서는 **좌상 → 우상 → 좌하 → 우하**. 둘 다 투명 영역과 반투명 외곽이 있다. ZIP은 ChatGPT 대화에서 사용자에게 제공한 `huddlers-rounded02-idle-motion-handoff.zip`; ZIP SHA256은 `581b00b42daf1c47c54bb1cea2edb7b43f625a2d4c667f7e12278f61f2315eb9`이다. ZIP 안 원본 PNG는 바이트 그대로 저장했고 `CHECKSUMS.sha256`을 포함한다. ZIP이나 원본 이미지는 이 문서 작성 시점 **GitHub에는 업로드하지 않았다**. 실제 파일을 반드시 Codex 대화에 첨부한다.

**관찰:** 4칸에 동일한 방향의 유사 캐릭터가 서 있지만 호흡 동작은 매우 미세하다. 컷 간 머리·양발·윤곽의 기준점 변화가 있어 정렬/루프가 실제로 자연스러운지는 미검증이다. 비교 시트를 분리·확대했다고 해서 네이티브 애니메이션을 확보한 것이 아니다.

## 전용 하네스와 의도적 분리

### 실제 Codex 수신 확인

후속 사용자 첨부는 `HF_Rounded02_Idle_Package_20261107.zip`이며 ZIP SHA256은 `e72e89bdc21d05dceb91ff87374315de951a7c6eec0aa5b56a3a9736427f8e49`다. 위 최초 패키지와 ZIP 이름/구성/해시는 다르지만, 내부 `rounded02_rev2_idle_nw.png`, `rounded02_rev2_idle_se.png`의 SHA256·바이트 수는 위 두 원본과 일치한다. 실제 패키지의 `README.txt`, `SHA256SUMS.txt`, `MANIFEST.json`도 수정하지 않고 보존한다.

현재 승인 문서는 `c1d4…` / `c1a1…` 디자인 원본을 선택했지만 Codex 로컬 Rev2 job의 원본은 `7e6b…` / `0e76…`이고 리뷰도 pending이다. 문서상 디자인 선택과 실제로 검증 가능한 동일 해시의 로컬 승인 리뷰를 구분한다. 정확한 승인 원본·리뷰 연결이 준비될 때까지 **정식 motion-lookdev job 준비는 차단**하고, 부모 미연결 원본 보존·독립 참고용 프레임 검사만 수행한다. 모션 승인이나 부모 승인을 꾸며 등록하지 않는다.

이전 `tools/lib/art-direction.mjs`의 코드·정책 해시와 기존 사용자 디자인 승인 계보를 바꾸지 않고, 새 `tools/motion-lookdev.mjs`로 독립적인 `motion-lookdev` 작업을 관리한다. **기존 `--art --stage lookdev`나 `native-base` 작업에 4컷 시트를 밀어 넣지 않는다.**

사용자 승인된 동일 방향 **lookdev 부모 job + review**가 실제로 Codex 환경에 있어야 모션 작업을 준비할 수 있다. 아래 경로는 예시로, 실제 준비된 Rev2 job 이름을 확인해 사용한다. 부모 승인 기록이나 수신 원본이 없으면 임의로 승인/receipt를 만들지 말고 멈춰서 보고한다.

```powershell
node tools/motion-lookdev.mjs prepare --view nw --out rounded02-rev2-nw-idle-motion-01 --parent-job "art/sprites/runs/실제-NW-REV2/job.json" --parent-review "art/sprites/runs/실제-NW-REV2/art-review.json"
node tools/motion-lookdev.mjs prepare --view se --out rounded02-rev2-se-idle-motion-01 --parent-job "art/sprites/runs/실제-SE-REV2/job.json" --parent-review "art/sprites/runs/실제-SE-REV2/art-review.json"
```

아래 명령은 원본 2장 다운로드/첨부를 Codex가 로컬 경로로 확보한 **이후에만** 실행한다. `--source`의 실제 경로를 대체하고 `--source-reference`에 실제 출처만 적는다.

```powershell
node tools/motion-lookdev.mjs intake --job art/sprites/runs/rounded02-rev2-nw-idle-motion-01/job.json --source "C:\Downloads\rounded02_rev2_idle_nw_motion_concept.png" --source-reference "실제 ChatGPT 원본 대화"
node tools/motion-lookdev.mjs intake --job art/sprites/runs/rounded02-rev2-se-idle-motion-01/job.json --source "C:\Downloads\rounded02_rev2_idle_se_motion_concept.png" --source-reference "실제 ChatGPT 원본 대화"
node tools/motion-lookdev.mjs inspect --job art/sprites/runs/rounded02-rev2-nw-idle-motion-01/job.json
node tools/motion-lookdev.mjs inspect --job art/sprites/runs/rounded02-rev2-se-idle-motion-01/job.json
```

원본 `source/candidate.png`와 `submission.json`은 덮어쓰지 않는다. 같은 job은 재수신 불가, 새 수정본은 새 이름을 사용한다. `build/motion-intake.json`에는 PNG 메타데이터·경고·프레임 검증 과제를, `build/motion-review.html`에는 **파일 변환 없이 CSS 위치를 이동시켜 보여 주는 네 칸 미리보기**를 남긴다. 이것은 실제 게임·프레임 정렬 보증이나 모션 승인 절차가 아니다.

## ChatGPT로 회신할 항목

1. 네 칸 모두 같은 캐릭터·의상·방향인가, 머리카락·주머니·소매·바지가 컷마다 튀지 않는가.
2. 발끝·발바닥의 월드 접점과 신체 중심은 맞는가. 자동 움직임 보정이 필요한가.
3. 1→2→3→4→1 순서로 숨쉬기·흔들림·되돌아옴이 실제로 보이는가. 컷별 팔·머리 등 부분이 무작위로 변형되는가.
4. 1배와 작은 표시의 가독성, 옷·머리·발의 픽셀 계단/색면 품질은 어떤가.
5. 원본 SHA256, 알파/투명도, 네이티브 규격 격차, 미해결 문제.

ChatGPT가 모션 미술 평가를 정리하고 **사용자가 실제 4컷 시안을 고를 때까지** `motion-review.template.json`은 `pending`을 유지한다. 모션 검토를 거쳐도 64×96 네이티브 규격·프레임별 앵커·레이어 충돌·게임 내 타이밍/루프 검증은 별도다.

## 한계와 다음 작업

현재 생성한 두 시트는 미술 탐색용이다. 네이티브 애니메이션은 **각 컷을 목표 논리 캔버스와 동일한 기준점/방향으로 원화 제작**하고 확인한 뒤 별도 승인한다. 원본에 가공·강제 축소·양자화·좌우 반전을 가해 완료라고 하지 않는다. 게임 적용·공개 배포는 이 요청 범위 밖이다.

변경한 하네스는 `web/tests/motion-lookdev.test.mjs`에 분리해 규칙을 테스트한다. 기존 전체 테스트, 실기기 렌더·게임 루프 검증 결과를 실행하지 않고 PASS라고 쓰지 않는다.
