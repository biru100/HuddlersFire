# Codex 작업 지시 · GitHub-first PNG 원본 이관

기준 PR: [#5](https://github.com/biru100/HuddlersFire/pull/5), 브랜치 `art/github-original-source-workflow-20261107`.

## 목적
사용자가 ZIP 다운로드가 자주 멈추는 문제를 보고했으므로 **ZIP 전달을 반복하지 말고 GitHub 실제 PNG 바이너리**를 원본 저장소로 삼는다. ChatGPT가 캐릭터/모션/의상 이미지 생성과 미술 평가를 담당하고, Codex는 원본의 정확한 SHA256 수신·검사·GitHub 커밋·게임 연동만 담당한다.

## 현재 작업 확인
1. PR #5를 checkout하고 `AGENTS.md`, [source-registry](../../../art/sprites/source-registry/README.md), [디자인 승인 근거](../../reviews/2026-11-07-rounded02-rev2-art-approval.md), [모션 기술 검증](../../reviews/2026-11-07-motion-harness-validation.md)를 읽어.
2. PR에는 두 개의 `MANIFEST.json`·`SHA256SUMS.txt`와 `tools/art-source-registry.mjs`가 존재한다. **아직 PNG 바이너리 4개는 원격 GitHub에 없으므로 '업로드 완료'라고 보고하지 마.**
3. 파일을 보존할 대상은 아래 정확한 네 원본이다. JPEG/브라우저 캡처/ZIP 압축 미리보기를 원본으로 쓰지 마.

| 상태 | 소스 파일 / GitHub 목적지 | SHA256 |
| --- | --- | --- |
| NW 승인 Lookdev | `art/sprites/source-registry/rounded02-rev2-lookdev/original/nw-approved.png` | `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a` |
| SE 승인 Lookdev | `art/sprites/source-registry/rounded02-rev2-lookdev/original/se-approved.png` | `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2` |
| NW 미승인 Idle 4컷 | `art/sprites/source-registry/rounded02-idle-motion-01/original/nw-idle-4cut-v1.png` | `7abce57cf6e2cd4a4f2611d9cabb652a40526b7faac26a229b4ba1aafa404581` |
| SE 미승인 Idle 4컷 | `art/sprites/source-registry/rounded02-idle-motion-01/original/se-idle-4cut-v1.png` | `1483c3c713929c407f0e427096d92dcf9b3fd0a995e08058369e4b3b792da929` |

실제 파일명/크기는 각 manifest에 있다.

## 원본 확보와 차단 원칙
- 기존 Codex 로컬 작업에서 보존한 모션 참고 원본 `art/sprites/incoming/rounded02-idle-motion-01/`를 먼저 확인해. SHA256이 위 두 모션 해시와 같으면 같은 바이트를 재사용한다. 이미 있는 파일을 다시 다운로드하거나 ZIP으로 재패키징하지 않는다.
- 디자인 NW·SE는 실제 사용자 승인 SHA256 `c1d4…`/`c1a1…`이다. 로컬의 다른 `7e6b…`/`0e76…` 원본을 승인본으로 슬쩍 바꾸면 안 된다. 대화 첨부 또는 사용자가 제공한 **실제 PNG 원본**에서 정확한 바이트를 찾아라.
- 로컬 파일이나 접근 가능한 경로에 해당 SHA 파일이 없으면 해당 방향은 `missing_original`로 보고하고 업로드를 중단한다. SHA를 바꾸거나 임의 생성/리사이즈해서 채우지 않는다. 실제 파일을 확보한 건만 진척으로 보고한다.

## 원본 등록
파일 경로가 확보된 경우에만 다음을 실행한다. 경로는 실제 파일로 바꾼다.

```powershell
node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json --nw "C:\\actual\\approved-nw.png" --se "C:\\actual\\approved-se.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json

node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json --nw "C:\\actual\\motion-nw.png" --se "C:\\actual\\motion-se.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json
```

동일한 바이트를 무손실 복사하고 기존 목적지 파일이 있으면 해시 대조만 수행한다. 덮어쓰기, 리사이즈, 양자화, 크롭, 좌우 반전, 알파 변환, 재인코딩 금지.

## 테스트와 GitHub 직접 업로드 완료 판정
1. `cd web`에서 `npm.cmd run test:art-source-registry`, `test:art-direction`, `test:motion-lookdev`, `test:sprites:pipeline`, `npm.cmd test`, `typecheck`, `build`를 수행하고 회귀가 있으면 고친다.
2. 원본이 확보된 경우 브랜치에 `art/sprites/source-registry/*/original/*.png`를 포함하여 커밋하고 push한다. 기존 `main`의 실시간 게임 자산/runtime은 변경하지 않는다.
3. push 후 GitHub에서 커밋 고정 URL로 네 PNG를 재조회하거나 새로 클론/받아서 SHA256을 다시 계산한다. 원격 4개가 모두 **예정 해시와 일치할 때만** '원본 GitHub 업로드 완료'로 보고한다.
4. 일부만 확보되면 status를 세트별로 분리하고 부족한 파일/원인을 정확하게 보고한다. 이미지가 없어도 PR 문서/코드/테스트는 별도로 진행할 수 있다.
5. 실제 원격 원본 검증, 테스트 결과가 나오기 전에 PR을 병합해 '최종 완료'라고 보고하지 않는다. 테스트만 통과해 PR을 병합하더라도 **원본 업로드 자체는 별도 미완료**라고 표시한다.
6. 업로드를 완료하더라도 `selected-lookdev`는 디자인 참고 원화 승인만 뜻하고 `pending-motion-review`는 모션 미술 승인 대기를 뜻한다. `art-review.json`, 네이티브 64×96, 프레임 루프/게임 적용, 공개 배포는 별도 단계다.

## 완료 보고에 넣을 항목
- PR URL/실제 커밋 SHA와 테스트 결과
- 원본 4개 각각 **GitHub raw 파일 링크 + SHA256 일치 여부**
- 누락 파일이 있다면 정확한 해시와 필요한 조치
- 승인된 캐릭터 룩데브, 미승인 Idle 모션, 네이티브 및 게임 런타임 상태를 별개로 기술
- 다음 ChatGPT 미술 평가에 필요한 GitHub 원본 주소

**파일이 GitHub에 존재하지 않는데 웹 링크나 업로드 완료를 만들어 보고하지 않는다.**
