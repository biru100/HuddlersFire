# rounded02-rev2-lookdev · 원본 PNG 저장소

이 폴더는 ZIP 없이 Github에서 **원본 PNG 바이트**를 직접 다운로드/검증하기 위한 고정 경로다.

- 용도: 사용자가 선택한 NW·SE 착의 룩데브 디자인 원본
- 승인/검토 상태: `selected-lookdev`
- 배포 상태: `productionReady:false`, `runtimeVerified:false`
- **최신 상태: 두 승인 원본 모두 GitHub에 무손실 업로드 완료.** 최초 Codex 로컬 검사에서는 누락됐지만 같은 대화에서 원본 2개를 찾아 복구하고 commit [`602c28c`](https://github.com/biru100/HuddlersFire/commit/602c28c5c897e7425cbb328bf1f7d9cdeb6b70ba)에 등록했다. GitHub `fetch_file(encoding=base64)` 응답으로부터 계산한 SHA256·바이트 수가 아래 승인 문서와 일치한다. [전체 검증 기록](../../../../docs/reviews/2026-11-07-github-originals-validation.md) 및 [기계 판독 기록](../REMOTE_VERIFICATION.json)을 따른다. 이 업로드는 디자인 LOOKDEV 선택과 별개인 native/runtime 승인을 의미하지 않는다.
- 파일명은 GitHub용 영문이며 실제 PNG 바이트는 SHA256으로 식별한다. 리사이즈, 자르기, 압축 재저장, 색상 양자화, 반전, 임의 프레임 추출은 금지.
- `SHA256SUMS.txt`의 각 값은 ChatGPT에서 생성한 원본 파일과 검증하여 작성했다. 새 이미지는 기존 이름 덮어쓰기 없이 새 set ID/파일명으로 추가한다.

## 파일 인계

| 방향 | GitHub 원본 파일 | 원본 제공 파일 | SHA256 |
| --- | --- | --- | --- |
| NW | `original/nw-approved.png` | `곱슬머리_소년의_후면_픽셀_아트.png` | `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a` |
| SE | `original/se-approved.png` | `세이지_후디를_입은_곱슬머리_소년_스프라이트.png` | `c1a19f22ee27fb911d4b1701f3fae913ce93b18d57382c70ef14efe8f3c580e2` |

저장소 루트에서:

```powershell
node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json --nw "C:\\path\\to\\NW-original.png" --se "C:\\path\\to\\SE-original.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json
git add art/sprites/source-registry/rounded02-rev2-lookdev/original art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json art/sprites/source-registry/rounded02-rev2-lookdev/SHA256SUMS.txt art/sprites/source-registry/rounded02-rev2-lookdev/README.md
git commit -m "Preserve rounded02-rev2-lookdev original PNGs"
git push
```

**git push가 성공한 뒤**, GitHub 브랜치에서 해당 파일이 실제로 열리고 클론/다운로드한 PNG의 SHA256이 동일한지 재검증한다. 그 다음에만 Codex 작업·미술 평가에 해당 GitHub 커밋 URL과 해시를 사용한다. GitHub에서 파일을 가져오는 환경에서는 다시 ZIP으로 묶지 않는다.

기존 사용자 디자인 선택 출처: [승인 기록](../../../../docs/reviews/2026-11-07-rounded02-rev2-art-approval.md). 이 문서로 기존 Codex `art-review.json` 기술 게이트를 자동 승인하지 않는다.
