# NW Idle 플랜 02 · 머리 잠금과 상체 부분 원화 합성 검토

2026-11-08 사용자 후속 요청. **ChatGPT가 승인 NW 디자인 원본을 f1 neutral로 사용할 수 있다고 검토했다는 사용자 전달**은 기록했다. 수정된 REGION_LOCKS/FRAME_INTENT는 아직 ChatGPT 검토를 받지 않았다. `confirm-plan`은 실행하지 않았다. [준비 폴더](../../../art/sprites/source-registry/rounded02-idle-frames-nw-02/README.md)와 [검토 화면](../../../art/sprites/source-registry/rounded02-idle-frames-nw-02/review/loop-preview.html)을 사용한다.

## 변경한 제안

- **머리 전체 잠금:** 머리 끝 허용을 없앴다. 보수적인 상단 전체 폭 띠 y=0..569로 모든 곱슬머리와 얼굴을 보호한다. 해부학적 마스크 승인으로 취급하지 않는다.
- **연결된 상체 영역:** 기존의 분리된 작은 허용 섬 대신 목 아래→어깨→후드→등 위가 이어지는 하나의 다각형을 제안한다. 손/하부 소매/밑단/바지는 기본 잠금이며 보이지 않는 가슴은 새로 그리지 않는다. 실제 연결이 자연스러운지는 ChatGPT가 검토한다.
- **주기:** 목표 1.8~2초. 초기 제안은 475ms×4=1900ms다. 프레임 의미는 f1 neutral, f2 inhale, f3 exhale, f4 return. 2→3만 큰 변화나 전신 바운스를 피한다.
- **합성 검토:** 전체 캐릭터 생성 실패를 사후 수리하는 경로를 만들지 않는다. 처음부터 **상체 부분 원화**를 요청하고, 미리 고정한 마스크로 원본 RGBA를 선택한다. 범위를 나중에 늘려 실패를 숨기지 않는다.

## 무손실·결정론적 합성의 의미와 한계

```text
C[p] = mask[p] == 1 ? generatedRGBA[p] : anchorRGBA[p]
```

원본과 같은 1086×1448 RGBA 캔버스에서 위치 변환 없이 수행한다. 부분 원화도 같은 캔버스를 요구해 crop offset이나 자동 정렬이 생기지 않게 한다. 마스크 밖은 투명한 부분 원화 또는 원본 문맥이어도 되지만, 사용된 픽셀과 제외된 차이를 모두 구분해 보고한다. source PNG 바이트는 그대로 보존한다. 파생 PNG는 새 파일이며 선택된 RGBA·반투명·숨은 RGB와 색 프로필을 보존하는 것이지 원본 PNG와 바이트가 같다는 뜻은 아니다.

블렌딩/페더링은 새 색·알파를 만들므로 이 경로에서 사용하지 않는다. 대신 **마스크 안쪽 4px의 고정 문맥 띠**가 생성 원본에서부터 f1과 정확히 같은지 검사한다. 경계 불일치나 띠/내부 접점의 급격한 색·알파 변화는 차단한다. 이음새의 미술적 자연스러움은 기술 통과와 별도로 ChatGPT가 평가한다. 생성 도구가 문맥 띠를 보존하지 못하면 원본과 실패 보고서를 남기고 중단한다. Codex가 띠를 덮어씌우거나 재작화해 통과시키지 않는다.

마스크는 REGION_LOCKS의 다각형을 원본 좌표의 픽셀 중심 규칙으로 rasterize한 **0/1 데이터**다. 이미지 알파를 이진화하는 것이 아니다. `COMPOSITE_MASK.bin`과 job/request의 SHA256을 함께 고정한다. 모델 출력에 따라 마스크를 자동 추정하거나 이동하지 않는다.

## 분리 보존 및 기술 보고

| 대상 | 보존/검사 |
| --- | --- |
| anchor | 기존 승인 PNG 무손실 복사·SHA·기존 부모 승인 fingerprint 유지 |
| 생성 원본 | `generated/frame02-inhale.png` 등 + receipt + MANIFEST/SHA256SUMS. 상체 부분 원화라는 scope 기록 |
| 선택 마스크 | `motion-plan/COMPOSITE_MASK.bin`·SHA·플랜 지문, 다각형과 바이트 재계산 대조 |
| 원본 기술 보고 | `review/f2-source-technical.json` 등. 선택 영역 변화/예산, 제외된 마스크 밖 변화 수·bbox, 머리/신발 등 보호 부위 변화, 경계 띠와 내부 gradient |
| 합성 결과 | `composites/frame02-inhale.png` 등, `f2-COMPOSITE.json`에 독립 PNG SHA·원본/anchor/mask/plan/intent SHA·변경 bbox·경계 보고·작업 목록 |
| 재검증 | 모든 선택 픽셀이 source, 나머지가 anchor와 같음을 디코딩 RGBA로 재계산. 오래된 원본/마스크/receipt/파생물·승인 확대 차단 |
| 시트/루프 | 네 실제 composite 입력의 위치·foot lock·hair lock·부위 예산·네 전환 리듬·4→1 검사 후 마지막 참고 시트 조립. 원본과 합성은 검토 HTML에서 별도로 표시 |

마스크 밖을 제외했다는 이유로 생성 원본 전체가 기술/미술 통과한 것으로 표시하지 않는다. 원본의 발/머리/문맥이 다르면 원본 보고서에 그대로 나타나며, 합성의 보호 영역 0변경과 나란히 공개한다. 모션은 `pending-motion-review`, decision pending, artApproved/animationApproved/productionReady/runtimeVerified false다.

## 먼저 ChatGPT에 보낼 검토 요청

다음 자료를 실제 첨부한다: f1 PNG, REGION_LOCKS.md/json, FRAME_INTENT.json, 검토 HTML 또는 오버레이 캡처. 현재 요청은 **새 프레임 생성 전 플랜 검토**다.

바로 사용할 [오버레이 PNG](../../../art/sprites/source-registry/rounded02-idle-frames-nw-02/review/region-plan-preview.png)는 검토 화면 캡처이며 원본 원화를 대신하지 않는다. `PREVIEW_ARTIFACT.json`의 별도 해시와 구분한다.

> 승인된 NW 원본을 f1 neutral로 사용할 수 있다는 기존 검토를 유지합니다. 첨부한 플랜 02를 다시 미술 검토해 주세요. 곱슬머리 전체는 잠그고, 목 아래·어깨·후드·등 윗부분의 연결된 호흡 영역이 실제 원화에 맞는지 확인해 주세요. 손/하체/신발/전신 위치/카메라는 고정입니다. 1.8~2초, 초안 475ms×4의 호흡 리듬을 검토해 주세요. 상체 부분 원화를 같은 캔버스에서 생성한 뒤 사전 마스크로 RGBA 그대로 선택하는 방식을 제안합니다. 안쪽 4px 문맥 띠가 f1과 같아야 하고 이음새를 새로 그리거나 블렌딩하지 않습니다. 이 제약으로 자연스러운 연결을 만들 수 있는지, 영역 경계·변화 예산·이음새 폭·프레임 의도의 수정점을 알려 주세요. 아직 원화 생성이나 모션 최종 승인으로 처리하지 마세요.

## 실제 검토 이후에만 실행할 순서

1. ChatGPT가 영역/마스크/예산/경계 띠/타이밍을 검토한다. 수정이 있으면 새 set을 준비한다. **현재 confirm-plan 금지**다.
2. 검토 출처를 기록한 뒤 f2/f3/f4를 각각 같은 f1·플랜·해시·해당 요청문으로 생성한다. `f2-request.txt/json` 등이 정확한 입력 형식이다. 모델은 관찰할 수 없으면 null/unverified다.
3. `intake`로 원본만 보존한다. 원본은 `generated/`, 합성은 `composites/`다. `compose`는 실제 수정 플랜 확인 전 차단된다.
4. 원본/경계 검사 → 합성 후보 → 네 프레임/루프 검사 → 마지막 참고 시트. ChatGPT 미술 평가와 사용자 모션 선택은 별개로 남긴다.

아래 명령은 **향후 실제 수정 플랜 미술 검토 이후의 예시**다. 이번에는 실행하지 않는다.

```powershell
$job = 'art/sprites/source-registry/rounded02-idle-frames-nw-02/job.json'
node tools/idle-frames.mjs confirm-plan --job $job --reference '실제 수정 플랜 검토 출처'
node tools/idle-frames.mjs intake --job $job --frame f2 --source 'C:\originals\f2-upper-source.png' --source-reference '실제 생성 대화' --anchor-sha c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a
node tools/idle-frames.mjs compose --job $job --frame f2
# f3/f4도 각각 원본 수신 → compose
node tools/idle-frames.mjs inspect --job $job
node tools/idle-frames.mjs assemble --job $job
```

이번에는 새 상체 원화/실제 composite/완성 시트를 만들지 않는다. 기존 플랜 01과 모든 이전 후보·승인 기록은 보존한다. native 64×96 변환, 게임 교체, 공개 배포는 범위 밖이다. 새 anchor/mask/플랜이 GitHub에 푸시되면 고정 커밋의 실제 원격 PNG/마스크 바이트와 SHA를 다시 검증한다.
