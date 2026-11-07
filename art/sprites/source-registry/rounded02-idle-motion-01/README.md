# rounded02-idle-motion-01 · 원본 PNG 저장소

이 폴더는 ZIP 없이 Github에서 **원본 PNG 바이트**를 직접 다운로드/검증하기 위한 고정 경로다.

- 용도: 미승인 NW·SE Idle 4컷 모션 탐색 원본
- 승인/검토 상태: `pending-motion-review`
- 배포 상태: `productionReady:false`, `runtimeVerified:false`
- 현재 커밋에서는 `original/*.png`의 **업로드가 아직 확인되지 않았다**. `MANIFEST.json`의 `originals[].path`는 예정 경로이고, 실제 파일 존재/원격 검증 여부를 확인한 후에만 업로드 완료라고 말한다.
- 파일명은 GitHub용 영문이며 실제 PNG 바이트는 SHA256으로 식별한다. 리사이즈, 자르기, 압축 재저장, 색상 양자화, 반전, 임의 프레임 추출은 금지.
- `SHA256SUMS.txt`의 각 값은 ChatGPT에서 생성한 원본 파일과 검증하여 작성했다. 새 이미지는 기존 이름 덮어쓰기 없이 새 set ID/파일명으로 추가한다.

## 파일 인계

| 방향 | GitHub 예정 파일 | 원본 제공 파일 | SHA256 |
| --- | --- | --- | --- |
| NW | `original/nw-idle-4cut-v1.png` | `아늑한_꼬마_소년_4프레임_스프라이트시트.png` | `7abce57cf6e2cd4a4f2611d9cabb652a40526b7faac26a229b4ba1aafa404581` |
| SE | `original/se-idle-4cut-v1.png` | `포근한_픽셀_소년의_숨결_애니메이션.png` | `1483c3c713929c407f0e427096d92dcf9b3fd0a995e08058369e4b3b792da929` |

저장소 루트에서:

```powershell
node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json --nw "C:\\path\\to\\NW-original.png" --se "C:\\path\\to\\SE-original.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json
git add art/sprites/source-registry/rounded02-idle-motion-01/original art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json art/sprites/source-registry/rounded02-idle-motion-01/SHA256SUMS.txt art/sprites/source-registry/rounded02-idle-motion-01/README.md
git commit -m "Preserve rounded02-idle-motion-01 original PNGs"
git push
```

**git push가 성공한 뒤**, GitHub 브랜치에서 해당 파일이 실제로 열리고 클론/다운로드한 PNG의 SHA256이 동일한지 재검증한다. 그 다음에만 Codex 작업·미술 평가에 해당 GitHub 커밋 URL과 해시를 사용한다. GitHub에서 파일을 가져오는 환경에서는 다시 ZIP으로 묶지 않는다.

이 모션 시트는 사용자의 최종 애니메이션 승인 전이며, 승인된 디자인 기준작과 독립적인 검토 상태다.
