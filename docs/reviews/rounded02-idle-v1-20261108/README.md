# Rounded 02 Rev2 · 부모 연결 + Idle v1 기술 검토

**디자인 부모 연결 완료, 모션은 `pending-motion-review`.** 기존 승인 문서의 실제 ChatGPT 평가와 사용자 선택을 정확한 원본 해시에 연결했다. 새 미술 평가나 모션 승인을 만들어 넣지 않았다.

## ChatGPT에 전달할 자료

1. [Idle v2 수정 요청서](IDLE_V2_REQUEST.md)를 전달한다. 승인된 디자인 원본 두 장과 수정할 방향의 Idle 원본을 GitHub 고정 주소로 함께 참조한다.
2. [NW 리포트](NW_REPORT.md) / [SE 리포트](SE_REPORT.md)의 프레임 표·전환 표·스크린샷을 본다.
3. [NW 루프·비교 HTML](nw-review.html) / [SE 루프·비교 HTML](se-review.html)을 각각 내려받아 브라우저에서 연다. 원본이 포함된 독립 파일이므로 ZIP이나 별도 서버는 필요 없다. GitHub 파일 화면은 HTML을 실행하지 않는다.
4. HTML에서 밝음/어두움, 재생/정지, 프레임 슬라이더, 발중점 위치 고정, 고스트를 비교한다. 250ms/컷은 미확정 재생 가설이다. CSS 고정은 진단이며 보정된 원화 납품이 아니다.

## 실제 부모와 모션 job

| 방향 | 검증된 디자인 부모 | 연결한 독립 모션 job |
| --- | --- | --- |
| NW | `art/sprites/runs/lookdev-nw-rounded02-rev2-approved-20261108/job.json` | `art/sprites/runs/motion-nw-rounded02-idle-v1-20261108/job.json` |
| SE | `art/sprites/runs/lookdev-se-rounded02-rev2-approved-20261108/job.json` | `art/sprites/runs/motion-se-rounded02-idle-v1-20261108/job.json` |

각 부모의 `art-review.json`은 [기존 승인 문서](../2026-11-07-rounded02-rev2-art-approval.md)의 여섯 관찰과 **“일단 확정하자 나쁘지 않은 것 같아”** 선택을 전사했다. 문서에 없던 대화 URL·모델·승인자는 추가하지 않았다. `review-sprite-job.mjs`의 기존 `verifyArtReview`로 원본·receipt·intake fingerprint·정책·리뷰 정합성을 검증했다.

- 디자인 NW `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`
- 디자인 SE `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2`
- 모션 NW `7abce57cf6e2cd4a4f2611d9cabb652a40526b7faac26a229b4ba1aafa404581`
- 모션 SE `1483c3c713929c407f0e427096d92dcf9b3fd0a995e08058369e4b3b792da929`

[lineage.json](lineage.json)에 실제 부모 proof, fingerprint, 모션 참조를 기록했다. 디자인에만 `artApproved:true`가 적용되며 `productionReady:false`, `runtimeVerified:false`다. 모션의 `decision:pending`, `artApproved:false`, `animationApproved:false`, `frameCellsVerified:false`, `loopVerified:false`는 그대로다. 그리드 측정과 미술적 동작 승인을 구분한다.

## 정렬 문제 요약

| 항목 | NW | SE |
| --- | --- | --- |
| 원본 / 셀 | 1254×1254 / 627×627 | 1254×1254 / 627×627 |
| 컷2→컷3 몸 중심 y 이동 | +14.7px | +15.5px |
| 컷1 발중점에 맞추는 컷2 CSS 이동 | (+4,+7)px | (−1,+5)px |
| 최대 원시 픽셀 차이 전환 | 2→3 | 2→3 |
| 4→1 평균 RGBA 오차 (원시→위치 정합 후) | 6.0→5.3 | 5.2→4.1 |
| 위치 정합 후 남는 변화 | 발·몸통·머리 영역에 잔여 차이 | 발·몸통·얼굴 포함 머리 영역에 잔여 차이 |

모든 수치는 원본 셀 기준이다. 발점은 신발 하단 윤곽의 **이미지 좌표 측정 가설**이며 월드 접점/해부학적 마커가 아니다. 양발 상대 벡터도 컷마다 달라 위치 이동 하나로 완전히 고정할 수 없다. 4→1만 수정하기보다 상태 차이가 큰 2→3도 우선 검토해야 한다. 정확히 다른 픽셀 비율은 미세한 색·알파 차이를 포함하므로 ‘재작화된 비율’로 읽지 않는다.

**단순 상하 이동만으로 설명되지는 않는다.** 발을 포함한 전체 위치 이동과 국소 픽셀/형태 변화가 함께 있다. 이를 호흡으로 자연스럽게 읽을 수 있는지는 ChatGPT 미술 검토와 사용자 선택이 필요하다. 최종 매력·동일 인물·모션 PASS는 부여하지 않았다.

## 기술적으로 가능한 보정과 원화 수정 구분

- **위치·표시만:** 공통 셀 크기/순서/재생 속도, 전체 translation 성분의 CSS 정합과 비교. 실제 게임 적용은 하지 않았다.
- **원화 검토·수정 필요:** 양발 상대 접점과 신발 형태, 곱슬 덩어리/후드/주름의 불연속, 몸통 호흡 대신 무릎·전신이 들썩이는지 여부, 2→3의 큰 차이와 루프 리듬.
- **알파 원인 확인 필요:** 거의 불투명한 alpha 253 등 내부 반투명과 셀 경계의 희미한 픽셀. 원본은 유지하며 자동 알파 이진화·색 양자화로 해결하지 않는다.

## 보존과 재현

`art/sprites/runs/`는 기존 Git 제외 정책을 유지했다. 이 폴더의 [evidence](evidence/)에 실제 부모/모션 job·receipt·리뷰·intake를 보존했고, 원본은 기존 source-registry에서 참조한다. JSON/TXT의 LF를 고정해 리뷰 바이트 fingerprint가 Windows 체크아웃으로 달라지지 않게 했다. 새 clone에서는 다음 명령이 **저장된 증거를 복원하고 기존 승인 게이트를 다시 통과**시킨다. 이미 같은 job이 있으면 덮어쓰지 않고 중단한다.

```powershell
node tools/restore-rounded02-idle-review.mjs
```

기존 잘못된 해시의 `lookdev-nw-rounded-02-rev2`, `lookdev-se-rounded-02-rev2` 후보·pending 리뷰는 수정하지 않았다. [preservation.json](preservation.json)은 이번 Windows 작업 폴더에서 원본 네 장·기존 후보·art-direction 정책/코드·앱/런타임 자산의 raw bytes가 작업 전후 같았음을 기록한다. 이 raw-byte 보존 기록은 다른 OS의 줄바꿈 해시와 동일함을 주장하는 용도가 아니다.

PNG 원본 재저장·프레임 PNG 추출·64×96 변환·알파 이진화·네이티브 제작·게임 자산 교체·공개 배포는 하지 않았다. 측정과 HTML은 기술 검토 자료이고 캡처 PNG는 해당 검토 화면이다. [실행 검증](VALIDATION.md)을 따른다.
