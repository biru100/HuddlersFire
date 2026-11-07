# PR #4 · 모션 하네스 실제 검증

기준: `biru100/HuddlersFire` PR #4, 최초 HEAD `ee77f12ced2b63e552193c22050e6d0d10268f91`, base main `c78fe92`. 사용자가 회귀 통과 후 병합을 명시했다. 이번 기록은 이전 테스트 결과 재사용이 아니라 로컬 프로젝트에서 실행한 결과다.

## 확인한 구현과 보완

- `tools/motion-lookdev.mjs`는 동일 방향의 유효한 디자인 부모 승인·원본 해시·리뷰 해시·캐시 참조를 확인한 뒤 별도 motion-lookdev 작업을 만든다. 기존 art-direction 모듈·정책은 변경하지 않아 이전 승인 fingerprint를 보존한다.
- PNG 수신은 원본 바이트 복사이며 2×2 미리보기는 CSS 영역 표시다. 실제 64×96 파일·생산 아틀라스·게임 애니메이션은 만들지 않는다. 기술 수신은 reference_only이며 모션 승인·루프·프레임 등록은 미검증으로 남는다.
- 기존 새 테스트 5개는 규칙·합성 receipt 위주였으므로 실제 Canvas 디코딩 경로를 검증하는 통합 검사 1개를 추가했다. 테스트 전용 4×4 PNG로 투명/반투명·셀 크기·CSS 네 컷·원본 미변경·빈 평가·잘못된 격자 차단을 검사한다. 이 fixture와 합성 승인 기록은 실제 원화·승인이 아니다.
- 테스트의 사용하지 않는 import를 제거했다. AGENTS의 과거 “승인 기준 없음” 문장을 문서상 캐릭터 선택과 실제 로컬 원본/리뷰 연결의 구분으로 갱신했다. 모션 인계 브리프에 실제 받은 ZIP과 부모 연결 차단 사유를 기록했다.

## 실행 결과

명령은 `web/`, Node v24.21.0 / npm 11.19.0, Windows PowerShell에서 실행했다. 수치는 포함 관계다.

| 명령 | 결과 |
| --- | --- |
| `npm.cmd run test:motion-lookdev` | **6/6 PASS** (최초 PR HEAD의 기존 5/5도 확인) |
| `npm.cmd run test:art-direction` | **34/34 PASS** |
| `npm.cmd run test:art-intake` | **4/4 PASS** |
| `npm.cmd run test:sprites:pipeline` | **77/77 PASS** |
| `npm.cmd test` | **300/300 PASS** |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS. vinext의 일부 route 정적 분류 unknown은 종료 코드 0의 안내 |
| `npm.cmd run test:render` | PASS. 기존 Canvas 다중 장면 검사 |
| `npm.cmd run lint` | 오류 0, 기존 런타임 경고 4개. 새 테스트의 unused import 경고는 제거 |
| 문법·문서 링크·`git diff --check` | PASS |

로그는 `/outputs/pr4-*.log`에 있다. 모션 원화 미술 평가·실제 게임 WebGL/UI·실기기·실인터넷·모션의 게임 적용은 이번 검사가 아니다. 앱 런타임과 기존 공개 원화는 변경하지 않았다. 공개 배포는 실행하지 않는다.

## 실제 ZIP과 승인 경계

사용자 ZIP `HF_Rounded02_Idle_Package_20261107.zip`은 1,291,172바이트, SHA256 `e72e89bdc21d05dceb91ff87374315de951a7c6eec0aa5b56a3a9736427f8e49`다. 원본 ZIP과 내부 5개 항목을 로컬 `art/sprites/incoming/rounded02-idle-motion-01/`에 변환 없이 보존했다. 처음 브리프의 ZIP 이름/구성/해시와는 다르지만 **두 PNG의 실제 SHA256·바이트 수는 manifest 및 PR 브리프와 일치**한다.

두 PNG는 각각 1254×1254, 가정된 2×2의 셀 크기는 627×627이다. 반투명 픽셀은 NW 394,801개, SE 397,040개다. 형식 검사만으로 네 컷의 정렬·양발 접지·동일 인물·4→1의 자연스러움이나 네이티브 납품을 승인하지 않는다.

문서상 승인 기록은 `c1d4…` / `c1a1…` 디자인 원본을 지정한다. 현재 로컬 디자인 job의 원본은 `7e6b…` / `0e76…`이고 두 art-review는 pending이다. 동일 해시의 부모 승인 원본·유효 리뷰를 확인할 수 없으므로 해당 로컬 파일에 문서 승인을 자동 이전하지 않는다. **정식 motion job 등록은 차단 상태**로 유지한다. 부모 미연결 참고 자료의 원본 보존·프레임 진단은 가능하지만 이를 승인 계보가 있는 모션 job이라고 표시하지 않는다.

이 부모 차단은 하네스 회귀 실패가 아니라 의도한 승인 게이트다. 현재 모션·네이티브·런타임·배포 승인은 모두 없다.
