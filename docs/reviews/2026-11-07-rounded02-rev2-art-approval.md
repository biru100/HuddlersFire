# Rounded 02 Rev2 | 사용자 미술 기준작 선택 기록

날짜: 2026-11-07 (Asia/Seoul)

## 결정

**사용자가 NW·SE 두 단독 원본을 Rounded 02의 미술 기준작으로 선택했다.** ChatGPT에서 두 원본의 미술 평가를 제시하고 "이 NW와 SE 두 이미지를 Rounded 02의 미술 기준작으로 확정할까?"라고 물은 뒤, 사용자는 **"일단 확정하자 나쁘지 않은 것 같아"**라고 답했다.

- 결정 출처: 이 작업의 ChatGPT 대화, 2026-11-07, "Rounded 02 Rev2 미술 검토 결과"와 그 직후 사용자 승인. 대화 링크는 확인되지 않았으므로 임의 URL을 만들지 않는다.
- 성격: **LOOKDEV_ONLY 미술적 기준작 승인**, 두 이미지의 구체적 선택. 이전의 "프로세스 전체 승인"과 구분한다.
- 이 문서만으로 Codex 로컬 `art-review.json`이나 `build/art-intake.json`이 생성·수정됐다고 주장하지 않는다. 정식 job 검증은 Codex 환경에서 이어서 수행한다.

## 선택된 원본 (변환 금지)

| 방향 | ChatGPT에서 제공된 원본 파일명 | PNG 크기 | SHA256 |
| --- | --- | --- | --- |
| NW 뒷사선 | `곱슬머리_소년의_후면_픽셀_아트.png` | 1086×1448 | `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a` |
| SE 앞사선 | `세이지_후디를_입은_곱슬머리_소년_스프라이트.png` | 1086×1448 | `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2` |

이 두 SHA256은 ChatGPT 대화의 원본 PNG 바이트를 직접 계산해 확인한 값이다. Codex가 수신한 Rev2 job과 각각 일치하는지 다시 대조한다. 파일을 임의로 리사이즈·재압축·양자화하거나 기존 원본에 덮어쓰지 않는다. 실제 이미지 생성 모델의 확정 메타데이터가 없는 경우 `observedModel: null/unverified`를 유지한다.

## ChatGPT 미술 평가 (룩데브 수준)

| 기준 | 판정 | 관찰 |
| --- | --- | --- |
| `silhouette` | pass (lookdev) | NW·SE 모두 머리, 내려진 후드, 양팔, 몸통, 두 다리와 신발이 분리돼 읽힌다. 앞선 초안보다 머리·몸통 비율이 안정적이다. |
| `direction` | pass (lookdev) | NW는 뒤통수/등/후드가 보이는 뒷사선이고 눈은 보이지 않는다. SE는 눈과 후드 전면이 보이는 앞사선이다. 실제 네이티브 단계에서 발 앞코·골반 방향의 픽셀 정합성을 재확인한다. |
| `pixel-language` | pass (lookdev) | 윤곽의 계단 표현과 색면이 비교적 통일돼 캐릭터 형태가 읽힌다. 실제 1px 논리 격자/이진 알파·64×96 납품을 증명하지는 않는다. |
| `palette` | pass (lookdev) | 밤갈색 곱슬머리, 세이지 후드티, 차콜 브라운 바지, 따뜻한 갈색 신발이 조화롭고 두 방향의 색감이 연결된다. 실제 캠프 주야간 조명 가독성은 별도 검증이다. |
| `character-appeal` | pass (lookdev) | SE의 친근한 표정과 특징적인 곱슬머리 실루엣이 캐릭터의 인상을 만든다. NW에도 같은 헤어·후드·체형 특성이 유지된다. |
| `scene-fit` | pass (lookdev only) | 포근한 HuddlersFire 캠프 콘셉트에 어울리는 착의 캐릭터 기준이다. 실제 지형·벤치 접촉·가림·주야간·UI 합성 품질은 미검증이다. |

평가 출처: 동일 ChatGPT 대화, 2026-11-07, "Rounded 02 Rev2 미술 검토 결과" 및 사용자 승인 직전 응답. 평가 당시 제시된 작은 크기 표시는 **가독성 가설**일 뿐 네이티브 스프라이트나 게임 렌더 증거가 아니다.

## Codex가 기록할 승인 증거

- NW/SE 각 job의 정확한 원본 SHA256과 intake fingerprint를 확인한다. 과거 버전의 job이나 다른 해시를 이 승인으로 승격하지 않는다.
- 각 `art-review.json`의 `artDirectorReview`에 실제 ChatGPT 미술 평가의 내용/출처를 기록하고, 여섯 기준의 위 관찰을 **해당 원본에 맞게** 쓴다.
- 사용자 선택의 실제 문구는 **"일단 확정하자 나쁘지 않은 것 같아"**이고, reference는 위 대화 참조로 남긴다. `reviewerRole: "user"`, `decision: "approved"`는 각 job의 기술적 blocker가 없는지 검증한 후에만 반영한다.
- `review-sprite-job.mjs` 등 기존 게이트로 실제 서명/출처·정합성 검사를 통과해야 `artApproved: true`로 보고할 수 있다. 승인 추정, 허위 원본/대화 URL이나 테스트 fixture를 사용하지 않는다.

## 다음 단계와 경계

**다음은 64×96 NW 기본 신체 1컷의 제작 가능성 확인이다.** 승인이 유효한 NW·SE 두 lookdev review를 참조해 `--stage native-base` job을 준비하고, 지원 도구가 실제 네이티브 규격을 납품하지 못하면 `blocked_native_delivery`를 남긴다. 단순 축소·양자화·코드 재작화로 통과시키지 않는다.

- `productionReady: false` 및 `runtimeVerified: false`를 유지한다.
- 기존 게임 원화/catalog/애니메이션, 네트워크, UI, DB 및 공개 배포를 수정하거나 승격하지 않는다.
- NW 네이티브 신체 뒤 hair/top/bottom 단일 조합과 실제 캠프 장면을 검증해야 나머지 방향·동작 확대를 판단한다.
