# HuddlersFire · GitHub-first original artwork registry

2026-11-07 결정: **ZIP 다운로드/전달을 기본 경로에서 폐기**하고, GitHub에 원본 PNG를 직접 보관한다. 새 ChatGPT 생성 원화(캐릭터, 방향별 시안, Idle/Walk/Sit 모션 프레임 및 의상 레이어)도 같은 원칙을 따른다.

## 책임과 경계

- **ChatGPT:** 이미지 생성, 방향/모션/의상 프레임의 미술 검토. 직접 GitHub 바이너리 업로드가 가능한 도구가 연결된 경우 동일한 원본 바이트를 업로드하고 업로드 후 원격 파일/해시를 검증한다.
- **Codex:** ChatGPT에서 직접 바이너리 GitHub 업로드가 불가능한 환경의 안전한 대체 업로더. 실제 원본 PNG를 받아 `tools/art-source-registry.mjs`로 해시 확인 후 Git 브랜치에 파일을 추가하고 PR을 작성/검증한다. ZIP 재압축을 필수 단계로 두지 않는다.
- **사용자:** 개별 이미지 승인. GitHub 원본 저장 자체는 미술·게임·배포 승인이 아니다.

**완료 판정:** GitHub의 실제 `original/*.png` 파일이 브랜치 또는 `main`에 존재하고, 파일을 재조회하거나 별도 클론해서 얻은 **바이트 SHA256이 MANIFEST.json의 값과 일치할 때만** "GitHub 원본 업로드 완료"라고 보고한다. `MANIFEST.json`이나 `SHA256SUMS.txt`만 커밋하는 것은 업로드 완료가 아니다. 업로드 불가능하면 그대로 장애를 보고하고 로컬/대화 첨부를 보존한다.

## 표준 구조

```text
art/sprites/source-registry/
  <new-asset-set-id>/
    README.md
    MANIFEST.json
    SHA256SUMS.txt
    original/
      nw-<role>-v1.png
      se-<role>-v1.png
```

**최신 상태: 4/4 원본 GitHub 업로드 및 재검증 완료.** 기존에 누락됐던 승인 디자인 NW·SE는 ChatGPT 대화의 원본 바이트로 복구했고, commit [`602c28c`](https://github.com/biru100/HuddlersFire/commit/602c28c5c897e7425cbb328bf1f7d9cdeb6b70ba)에 무손실 저장했다. GitHub에서 재조회한 PNG의 SHA256이 원본과 일치했다. Idle NW·SE는 이전 [`f822f7b`](https://github.com/biru100/HuddlersFire/commit/f822f7b89a28aae7696abf6a611b0b480b8bcd53)에서 이미 업로드·HTTP 재검증됐고, 최신 브랜치에서 파일 존재/바이트/Blob SHA를 다시 확인했다. [후속 검증 기록](../../../docs/reviews/2026-11-07-github-originals-validation.md) 및 [기계 판독 기록](REMOTE_VERIFICATION.json)을 따른다. 파일 업로드는 모션·네이티브·게임 적용 승인을 의미하지 않는다.

- [Rounded 02 Rev2 사용자 선택 착의 룩데브](rounded02-rev2-lookdev/README.md). 두 PNG는 **미술 기준으로 사용자 선택 완료**지만 네이티브 제작/게임 검증은 별개다.
- [Rounded 02 Idle 모션 4컷 시안](rounded02-idle-motion-01/README.md). 사용자 모션 승인 **대기**, 비네이티브 참고 자료다.

## 재현 절차 (로컬 또는 Codex)

원본 PNG 두 개를 실제로 확보한 환경에서 프로젝트 루트 기준:

```powershell
node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json --nw "C:\\originals\\nw.png" --se "C:\\originals\\se.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-rev2-lookdev/MANIFEST.json
node tools/art-source-registry.mjs ingest --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json --nw "C:\\originals\\motion-nw.png" --se "C:\\originals\\motion-se.png"
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-idle-motion-01/MANIFEST.json
```

네 원본 바이트의 SHA·크기·PNG 헤더가 기록값과 다르면 실행을 중단하고 **다른 파일을 승인본으로 바꿔치기하지 않는다**. 기존 동일 SHA 파일은 보존하고 서로 다른 바이트는 덮어쓰지 않는다.

그다음 변경 브랜치에서 다음 경로를 `git add`/commit/push 한다. 커밋 후 GitHub 웹/커넥터에서 실제 원본 바이너리 파일 4개가 있는지와 SHA256을 재검증한다.

```powershell
git add art/sprites/source-registry/rounded02-rev2-lookdev/original art/sprites/source-registry/rounded02-idle-motion-01/original
git commit -m "Preserve Rounded 02 original lookdev and motion PNGs"
git push
```

오류 없는 `git push` 이후에도 **원격 바이트 검증**을 생략하지 않는다. 성공하면 ChatGPT는 ZIP이 아닌 정확한 GitHub 커밋 링크(고정 SHA)로 원화를 참조하며, Codex는 이 바이너리를 별도의 승인 job으로 수신/기술 검증한다.

## 승인 데이터와 파일 구분

- GitHub `source-registry`는 **변경 불가능한 원본 파일/해시/메타데이터의 저장 장소**다. `art/sprites/runs/`의 `job.json`, `submission.json`, `art-review.json` 및 기존 네이티브/픽셀 리뷰 게이트를 대체하지 않는다.
- `MANIFEST.json`의 `reviewState:"selected-lookdev"`는 문서에서 사용자 선택을 확인한 미술 기준작이라는 뜻이지 Codex의 `artApproved:true`, `productionReady:true`라는 뜻이 아니다.
- `reviewState:"pending-motion-review"`는 디자인 부모 승인을 모션 승인으로 이어받지 않는다는 뜻이다.
- 파일명이 바뀌어도 실제 바이트는 그대로 두며, 업데이트·수정본은 **새 setId와 새 원본**으로 등록한다. 기존 SHA와 파일을 덮어쓰지 않는다.
- 이미지 제작 모델 표시가 관찰 불가능하면 `observedModel:null`로 둔다. 임의 모델 버전이나 대화 URL을 쓰지 않는다.
- 이 저장소는 **공개 GitHub 저장소**다. 인물 사진, 신상정보, NDA 자료, 비공개 IP 등 공개가 허가되지 않은 이미지를 이 경로에 올리지 않는다. 확인이 필요하면 업로드를 멈춘다.

## ZIP 예외

기존 `art/sprites/incoming/lookdev-handoff-v2/`의 ZIP은 **역사적 원본 수신 기록**으로 보존한다. 새 자산의 기본 인계에서 ZIP을 다시 만들거나 필수 첨부로 요구하지 않는다. GitHub 바이너리 업로드가 지원되지 않는 환경이라면 사용자가 직접 첨부한 PNG를 Codex 로컬에서 확보하여 위의 절차로 업로드한다. 파일도 없고 원격 업로드도 불가능한 경우에는 완료했다고 보고하지 않는다.

**검사:** `cd web && npm run test:art-source-registry` 및 변경 범위의 기존 아트/모션/전체 회귀 테스트.
