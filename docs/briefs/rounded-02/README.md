> **2026-11-07 신규 애니메이션 단계:** ChatGPT가 생성한 NW/SE **각 2×2 4컷 Idle 모션 시안**을 전달할 때에는 [모션 전용 브리프](animation-idle-handoff.md)와 `tools/motion-lookdev.mjs`를 따른다. 기존 캐릭터 착의 시안 승인 기록은 유효하나 새 모션은 별도로 검수한다. 아래 내용은 Rounded 02의 최초 캐릭터 디자인 준비에 관한 이력이다.

# Rounded 02 · NW/SE 독립 원화 작업 환경

> **2026-11-07 후속:** Rev2 NW·SE의 사용자 미술 기준작 선택이 확정됐다. [승인 기록](../../reviews/2026-11-07-rounded02-rev2-art-approval.md)에 정확한 두 원본 해시, ChatGPT 평가, 실제 선택 발언과 다음 기술 게이트를 남겼다. 아래의 ‘미수신/승인 대기’는 당시 작업 준비 상태를 기록한 이력이며, 현재 Codex 작업의 실제 수신 상태를 대신하지 않는다.


기준: PR #2의 `art/quality-first-harness-20261107`, 확인한 HEAD `48be5e5`. [기존 Rounded 02 브리프](../nw-se-rounded-lookdev-02.md)를 이어간다. **미술 평가·원화 생성은 ChatGPT, 원본 보존·기술 검증·승인 후 게임 적용은 Codex**가 담당한다.

현재 ZIP과 참고 PNG 3장은 [원본 보존 폴더](../../../art/sprites/incoming/lookdev-handoff-v2/README.md)에 있고 모두 미승인이다. 새 NW·SE 원본, 실제 ChatGPT 원본 평가, 사용자의 파일별 선택은 아직 없다. 기본 신체·네이티브 스프라이트·게임 적용·공개 배포는 진행하지 않는다.

## ChatGPT에 전달할 자료

1. [공통 맥락](DESIGN_CONTEXT.txt)을 먼저 전달하고 ZIP의 두 `reference-only/` 보드를 디자인 참고용으로 첨부한다. 실제 파일명/역할/해시는 원본 폴더의 manifest와 기술 보고서에 기록돼 있다.
2. 한 번에 [NW 요청문](NW_REQUEST.txt) 또는 [SE 요청문](SE_REQUEST.txt) 하나만 전달한다. 같은 캐릭터를 각각 독립된 원화로 제작한다. 두 요청문은 현재 하네스의 `artPrompt`와 같은 내용이다.
3. 각 생성 결과는 실제 다운로드 원본 PNG로 받는다. 반대 방향의 새 원본이 이미 있으면 같은 인물 참고로 추가하되 사용자 승인을 받은 것으로 표시하지 않는다. 비교판에서 추출하거나 반전하지 않는다.

## 필요한 파일

| 파일 | 내용 | 현재 상태 |
| --- | --- | --- |
| `rounded-02-nw.png` | 같은 인물의 NW 뒷사선, 착의 idle 한 명, 투명 배경 | 미수신 |
| `rounded-02-se.png` | 같은 인물의 SE 앞사선, 착의 idle 한 명, 투명 배경 | 미수신 |
| ChatGPT 평가 기록 | 각 원본을 특정하는 파일명/해시·여섯 기준의 관찰·실제 대화 출처 | 대기 |
| 사용자 선택 기록 | 각 원본의 실제 선택 발언·출처 | 대기 |

PNG는 생성 도구의 원래 해상도를 유지한다. 이번 lookdev에서 정확한 64×96, 6색 팔레트, 레이어·스킨 마스크·애니메이션을 요구하지 않는다. 원본의 투명도·비율·색·픽셀 표현의 한계는 기술 정보와 ChatGPT 평가로 분리한다. 모델 표기나 도구 메타데이터가 없으면 실제 모델은 `null/unverified`로 남긴다.

## 준비한 두 작업과 재현

다음 두 job을 준비했으며 각각 `awaiting_external_art`, `generated:false`다. `source/`는 비어 있고 승인 파일과 native job은 없다. 실행별 job은 기존 Git 제외 정책에 따라 로컬에 유지한다. 다른 환경에서는 다음 명령으로 재현한다. 같은 이름이 있으면 덮어쓰지 말고 기존 job의 유효성을 먼저 확인한다.

```powershell
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --view nw --out lookdev-nw-rounded-02
node tools/prepare-sprite-job.mjs --art --stage lookdev --variation rounded --view se --out lookdev-se-rounded-02
```

## 새 원본 전달과 기술 검사

Codex/AgentHub 대화에 두 PNG 원본을 첨부하거나 각각의 전체 로컬 경로를 알려 준다. 다음 문장처럼 어느 파일이 어느 job인지 명시한다.

> Rounded 02 원본입니다. NW는 `rounded-02-nw.png`, SE는 `rounded-02-se.png`입니다. 원본 보존과 기술 검사만 진행해 주세요. ChatGPT 평가 출처: (실제 링크/대화 참조). 모델 정보: (실제 관찰 또는 확인 불가).

파일명은 식별용이다. 다른 다운로드 이름이어도 바이트를 바꾸지 않고 수신할 수 있다. 파일 제출 자체를 미술 선택으로 기록하지 않는다.

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-nw-rounded-02/job.json --source "C:\Downloads\rounded-02-nw.png" --source-reference "실제 ChatGPT 대화 출처"
node tools/rebuild-sprites.mjs --job art/sprites/runs/lookdev-se-rounded-02/job.json --source "C:\Downloads\rounded-02-se.png" --source-reference "실제 ChatGPT 대화 출처"
node web/tests/render-scene-preview.mjs --job art/sprites/runs/lookdev-nw-rounded-02/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/lookdev-se-rounded-02/job.json
```

수신 후 원본 해시·PNG 크기/알파와 오프라인 `art-review.html`을 만든다. 큰/작은 CSS 표시와 명암 바탕은 기술 확인 보조이며 실제 게임 화면이 아니다. 미술적 관찰은 ChatGPT에 전달하고, Codex는 그 실제 평가와 사용자 선택을 기록한다. 생성되는 `art-review.template.json`은 pending/unreviewed를 유지한다.

NW·SE의 ChatGPT 평가와 사용자의 개별 원본 선택이 모두 준비된 후에만 다음 제작 결정을 검토한다. 현재 단계에서는 native-base 명령을 실행하거나 catalog/런타임 자산에 연결하지 않는다. 회귀·보존 결과는 [후속 검증 기록](../../reviews/2026-11-07-rounded02-handoff-validation.md)을 따른다.
