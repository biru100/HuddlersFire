# Rounded 02 NW Idle · 플랜 02 (미술 재검토 대기)

**f1 neutral은 사용 가능. 수정 영역·마스크·타이밍은 미확인. confirm-plan 미실행.**

사용자가 전달한 실제 ChatGPT 검토의 범위는 [NEUTRAL_ANCHOR_REVIEW.json](motion-plan/NEUTRAL_ANCHOR_REVIEW.json)에 보존했다. 새 모션 원화나 합성 결과는 없다. 디자인 승인은 유지하고 motion/native/runtime은 pending이다.

| 파일/범위 | 내용 |
| --- | --- |
| `base/frame01-anchor.png` | 승인 NW 원본 그대로, 521850 bytes, 1086×1448 RGBA, SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a` |
| `motion-plan/REGION_LOCKS.json/md` | 곱슬머리 전체를 잠그는 보수적 상단 띠 + 목 아래/어깨/후드/등 위의 연결된 허용 영역 초안 |
| `motion-plan/COMPOSITE_MASK.bin` | 사전 동결된 원본 좌표의 0/1 선택 데이터. 픽셀 알파 변환이 아님. 정확한 해시는 job/request JSON에 있음 |
| `motion-plan/FRAME_INTENT.json` | f1 neutral / f2 inhale / f3 exhale / f4 return, 각 475ms = 1900ms. 목표 1800~2000ms의 초안 |
| `motion-plan/f2-request.txt/json` | 상체 부분 원화 개별 요청서. f3/f4도 동일 f1 기준. 현재는 수정 플랜 미술 검토가 먼저 |
| `generated/` | 앞으로 ChatGPT에서 받은 원본 PNG + receipt를 그대로 저장. 현재 비어 있음 |
| `composites/` | 별도 해시·provenance를 가진 마스크 합성 파생물. 현재 비어 있음 |
| `review/` | 원본/합성 변경 영역·제외 변경·경계·루프의 기술 자료. 현재 `awaiting_frames`, 생성 미술 평가 없음 |

[검토 화면](review/loop-preview.html)에서 **빨강=잠금, 초록=연결된 허용 영역**을 확인한다. 상단 전체 폭 570px 높이의 띠는 곱슬머리를 빠뜨리지 않기 위한 보수적 제안이다. 실제 목 아래/후드/어깨 경계와 호흡 범위·변화 예산·경계 띠 4px의 적절함은 ChatGPT가 다시 검토해야 한다.

ChatGPT에 첨부하기 쉬운 [영역 오버레이 PNG](review/region-plan-preview.png)도 준비했다. 이는 원화가 아닌 격리 검토 화면의 캡처이며 [PREVIEW_ARTIFACT.json](review/PREVIEW_ARTIFACT.json)에 별도 해시·anchor/plan/mask 계보를 기록했다. 원본 f1 PNG와 함께 전달한다.

합성은 `C[p] = mask[p] ? generated[p] : anchor[p]`로 RGBA 네 채널을 그대로 선택한다. 경계 안쪽 4px 띠는 생성 원본부터 anchor와 같아야 하며, 불일치 시 합성하지 않는다. 경계 띠와 내부 사이의 채널 변화도 검사한다. feathering, blending, resize, 양자화, alpha 이진화, 자동 정렬/반전/그리기를 하지 않는다.

원본의 마스크 밖 변경은 버리지 않은 **원본 파일**과 기술 보고서에 그대로 남긴다. 합성에서 제외한 변경의 개수/bbox, 보호 부위별 원본/합성 변경, 사용 마스크 해시, 내부 이음새 지표를 공개한다. 합성이 기술 통과해도 생성 원본 전체를 성공한 완성 캐릭터로 표시하지 않는다.

[수정 플랜 검토 요청 및 CLI](../../../../docs/briefs/rounded-02/idle-masked-upper-body-02.md)를 따른다. `confirm-plan`은 실제 수정 플랜 미술 검토 전 실행하지 않는다. 원화 생성·평가는 ChatGPT, 원본/기술 검증·결정론적 조립은 Codex, 모션 선택은 사용자다. 모션 관련 artApproved/animationApproved/productionReady/runtimeVerified는 false, decision은 pending이다.
