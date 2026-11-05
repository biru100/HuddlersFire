---
name: camp-add-game-booth
description: "HuddlersFire 전시장에 게임 부스를 추가하거나 기존 부스의 소개·트레일러·썸네일·SNS 정보를 갱신할 때 공통 부스 템플릿과 검증 절차를 적용한다."
---

# 게임 전시 부스 추가·갱신

프로젝트 루트에서 작업한다. 기존 공통 템플릿을 재사용하고 게임별 화면을 복제하지 않는다. 계획만 요청받았다면 조사와 계획까지만 진행한다. 구현 승인이 배포까지 포함하는 것은 아니며, 이미 받은 구현·배포 승인은 다시 묻지 않는다.

## 자료 확인

- [게임 부스 안내](../../../docs/game-exhibits.md)의 최신 스키마와 표시 계약을 먼저 읽는다. 제품 판단이 필요하면 [의도 기준](../../../docs/project-intent.md)의 해당 결정을 확인한다.
- 사용자가 준 공식 홈페이지·개발사·게임 채널에서 소개, 공식 YouTube 트레일러, 출시·플랫폼, 구매·플레이 링크와 SNS를 확인한다. `source`와 실제 확인일 `checkedAt`을 남긴다. clukostudio.com은 현재 PARRUITS!의 출처이며 다른 게임의 기본 출처로 쓰지 않는다.
- 미확인 출시 정보·계정·링크를 추측하지 않는다. SNS 미등록은 `null`로 두어 아이콘을 비활성화한다. 계정이 없다고 단정하지 않는다. 공식 트레일러가 없으면 `trailer: null`, `cover: ''`와 확인된 로고/제목 대체 표시를 사용하고 미확인 사항을 보고한다. 다른 게임 영상을 대신 넣지 않는다.

## 이미지와 데이터 반영

공식 트레일러가 있으면 프로젝트 루트에서 아래 도구로 YouTube 썸네일을 준비한다. `web/` 의존성이 설치되어 있어야 한다. 처음에는 `--dry-run`으로 입력·예상 경로만 확인할 수 있다.

```powershell
node .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.mjs --game-id my-game --trailer-url "https://www.youtube.com/watch?v=VIDEO_ID_HERE"
```

도구는 maxres → hq 순서로 JPEG 실데이터·크기·해상도를 검사하고 `web/public/games/<game-id>-trailer-thumbnail.jpg`에 저장한다. 기존 파일은 보존하며, 승인된 이미지 갱신에는 `--replace`를 쓴다. 모든 후보가 실패하면 멈추고 오류를 보고한다. 출력 JSON의 원본 URL·영상 ID·해상도·해시를 확인하고, 확인한 권리자와 출처를 `web/public/games/CREDITS.txt`에 기록한다. 도구는 크레딧이나 게임 데이터를 자동 수정하지 않는다.

- [게임 목록](../../../web/lib/camp-games.mjs)의 `EXHIBITED_GAMES`에 `createGameExhibit`로 추가한다. 갱신 요청이면 기존 ID를 유지하며 중복 항목을 만들지 않는다. 필드 예제는 게임 부스 안내를 따른다.
- `cover`는 도구가 출력한 로컬 `/games/…jpg` 경로, `trailer`는 확인한 YouTube 영상 주소로 지정한다. SNS는 지원하는 여섯 채널의 공식 HTTPS 프로필·초대 주소만 등록한다.
- [맵 배치](../../../web/lib/camp-maps.mjs)의 `GAME_BOOTHS`에 같은 `gameId`를 연결한다. 고유한 부스 ID를 쓰고 현재 전시장 경계·장애물·포탈·스폰·상호작용 거리를 읽어 이동 경로와 접근 공간을 확보한다. 합리적인 빈 위치를 고를 수 있으면 배치 선택을 다시 묻지 않는다. 좌표 예제는 고정 예약 위치가 아니다.

## 확인과 마무리

[변경 검증 스킬](../camp-change-validation/SKILL.md)을 변경 범위에 맞게 적용한다. 카탈로그·맵 ID 연결과 중복, 로컬 이미지·크레딧·링크를 확인하고 관련 게임 검사·typecheck/build를 실행한다. 이미지·배치를 바꿨으면 렌더로 새 부스가 보이고 접근 가능한지 확인한다.

새 부스의 접근 → E/소개 버튼 → 팝업, 메인 트레일러와 원본 링크, SNS 활성/비활성, 닫기·입력 잠금·포커스 복귀를 PC·모바일 범위에서 확인한다. 기존 전시장 브라우저 검사는 첫 부스/PARRUITS! 중심이므로 통과만으로 새 게임을 검증했다고 하지 않는다. 새 ID와 위치를 대상으로 필요한 검사를 보완하고, 모의 iframe 검사를 실제 YouTube 재생 확인과 구분한다. 개인 브라우저를 조작하지 않는다.

팝업의 자동 재생 금지, 닫을 때 플레이어 제거, 공용 라디오·개인 음소거 분리를 보존한다. [검증 기록](../../../docs/validation.md)에 실행한 검사와 한계를 남긴다. 배포가 요청된 경우에만 기존 프로젝트의 공개 절차를 따른다.

썸네일 도구를 수정했다면 오프라인 검사도 실행한다.

```powershell
node --test .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.test.mjs
```
