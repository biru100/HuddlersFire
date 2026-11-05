# 게임 전시 부스 템플릿

게임별 정보는 `web/lib/camp-games.mjs`의 `createGameExhibit`로 정의한다. 부스와 소개 팝업은 같은 게임 ID를 읽는다. 이미지·영상·SNS마다 별도 화면을 복사하지 않는다. 현재 공개 목록은 PARRUITS!와 Torizon Telecom이다. 공통 틀은 공개 버전 22, PARRUITS!의 YouTube 썸네일 대표 이미지는 버전 23, Torizon Telecom 추가는 후속 배포 요청에 따라 버전 24에 반영했다.

## 스킬로 추가·갱신

[camp-add-game-booth](../.agents/skills/camp-add-game-booth/SKILL.md)는 공식 자료 확인, YouTube 썸네일 준비, 게임 데이터·맵 배치, 검증을 안내한다. 예: `$camp-add-game-booth 공식 홈페이지 https://example.com/ 의 게임을 전시장에 추가해줘`. 기존 게임의 정보 갱신에도 사용한다. 부스 추가 요청만으로 공개 배포하지 않는다.

프로젝트 루트에서 아래 명령으로 썸네일을 준비한다. `web/` 의존성이 설치되어 있어야 하며 `my-game`과 영상 주소는 해당 게임의 실제 값으로 바꾼다.

```powershell
node .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.mjs --game-id my-game --trailer-url "https://www.youtube.com/watch?v=VIDEO_ID_HERE" --dry-run
```

`--dry-run`을 빼면 maxres → hq 순서로 내려받아 JPEG 내용·8 MiB 제한·최소 480×270 해상도를 확인한 후 `web/public/games/my-game-trailer-thumbnail.jpg`에 저장한다. `--dry-run`은 다운로드나 파일 생성을 하지 않는다. 기존 파일은 덮어쓰지 않으며 승인된 갱신에는 `--replace`를 사용한다. 두 후보가 모두 실패하면 이미지 파일을 남기지 않는다. 출력 JSON의 출처·해상도·해시와 확인한 권리자를 `CREDITS.txt`에 기록하고 아래 카탈로그의 `cover`를 연결한다. 도구는 카탈로그·맵·크레딧을 자동 수정하지 않는다.

도구 자체의 오프라인 검사는 `node --test .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.test.mjs`로 실행한다.

## 게임 정보 추가

`EXHIBITED_GAMES` 목록에 아래 형태로 항목을 추가한다. 이미지 파일은 `web/public/games/`에 저장하고 출처·권리를 같은 폴더의 `CREDITS.txt`에 기록한다.

```js
createGameExhibit({
  id: 'my-game',
  title: '게임 이름',
  studio: '개발팀',
  tagline: '한 줄 소개',
  description: '게임을 소개하는 짧은 설명',
  details: ['장르', '플레이 인원', '지원 플랫폼'],
  release: '출시 정보',
  image: '/games/my-game-logo.webp', // 소개 상단 로고
  cover: '/games/my-game-trailer-thumbnail.jpg', // 트레일러의 YouTube 썸네일 사본
  trailer: null, // 공식 YouTube 영상 주소를 넣는다. 없으면 준비 중 표시
  socials: {
    youtube: null,
    x: null,
    instagram: null,
    discord: null,
    reddit: null,
    tiktok: null,
  },
  links: [], // { label: '플레이하기', url: 'https://...' }
  source: '', // 공식 소개 출처
  checkedAt: '2026-11-05',
})
```

전시장에 배치하려면 `web/lib/camp-maps.mjs`의 `GAME_BOOTHS`에 같은 `gameId`를 넣는다. 위치는 다른 시설·포탈 및 참가자의 이동 경로와 겹치지 않게 고른다.

```js
{ id:'my-game-booth', type:'gameBooth', gameId:'my-game', label:'게임 이름', x:4, y:-2, r:.85 }
```

## 표시와 동작

- 부스 대표 이미지는 공식 트레일러의 YouTube 썸네일을 `public/games/`에 저장해 `cover`로 지정한다. 현재 PARRUITS!는 `s0pMzMwvKgE/maxresdefault.jpg`의 1280×720 원본을 사용한다. 부스는 같은 비율로 중앙에서 잘라 표시한다. `cover`가 없으면 로고를 시도하며 로딩이 실패해도 게임 이름은 남는다. 이미지 요청 실패는 캐시해 프레임마다 다시 요청하지 않는다. 필드 이미지는 `/games/`의 로컬 WebP·PNG·JPEG만 사용한다.
- 가까이에서 E 또는 소개 버튼으로 개인 팝업을 연다. 상단 로고·제목 다음에 YouTube 트레일러가 가장 큰 콘텐츠로 나오고 소개·SNS·출시 정보·관련 링크가 이어진다.
- 트레일러는 검증한 YouTube 영상 ID만 임베드하고 자동 재생하지 않는다. 재생 제한에 대비해 원본 영상 링크도 제공하며, 팝업을 닫으면 iframe을 제거한다. 공용 라디오의 곡·재생 상태·개인 음소거를 자동으로 변경하지 않는다.
- SNS는 YouTube·X·Instagram·Discord·Reddit·TikTok 순서의 공통 아이콘이다. 값이 `null`·빈 문자열·공백이거나 HTTPS/해당 플랫폼 주소 형식이 아니면 흐린 비활성 버튼으로 표시한다. 비활성 항목에는 `href`와 클릭 동작을 주지 않는다. 이는 **링크가 미등록**이라는 뜻이며 해당 플랫폼에 계정이 존재하지 않는다는 외부 조사 결과가 아니다.
- PC·모바일에서 같은 템플릿을 사용한다. 라디오와 소개 팝업이 겹치지 않게 높이를 확보하고, 본문을 스크롤해도 닫기 버튼을 유지한다. 팝업 동안 필드 입력을 잠그고 닫을 때 필드 포커스를 돌려준다.

현재 PARRUITS! 트레일러는 공식 채널의 [Official Announcement Trailer](https://www.youtube.com/watch?v=s0pMzMwvKgE)다. SNS는 [공식 홈페이지](https://clukostudio.com/)에서 확인한 주소를 사용하며 TikTok 링크는 미등록으로 둔다. 아이콘 출처·CC0 안내는 `web/public/icons/social/CREDITS.txt`에 있다.

## Torizon Telecom 추가 (2026-11-05)

- 게임 ID는 `torizon-telecom`, 부스 ID는 `torizon-telecom-booth`이며 전시장 `(4, -2)`에 배치한다. 기존 PARRUITS! `(0, -2)`와 근접 상호작용 범위가 겹치지 않는다.
- [공식 게임 페이지](https://madeinskago.com/TorizonTelecom/)의 소개·로고와 [Steam](https://store.steampowered.com/app/4599560/Torizon_Telecom/?l=koreana)의 Windows·한국어 지원·2027년 출시 예정·무료 데모 정보를 사용한다. 오래된 itch.io의 출시/데모 안내보다 현재 Steam 표시를 우선했다.
- [개발사의 Steam 공지](https://steamcommunity.com/app/4599560?l=koreana)가 소개한 [Gameplay Trailer](https://www.youtube.com/watch?v=eDon6CQezQY)를 사용한다. YouTube oEmbed에서 제목, 제작자 SkagoGames, 채널 `@skagogames`, 임베드 응답을 확인했다. 썸네일은 도구로 maxres 원본 1280×720·97,428바이트를 검증해 로컬에 저장했다. 로고는 공식 페이지의 원본 PNG 566×180이며 둘 다 출처를 `web/public/games/CREDITS.txt`에 기록했다.
- YouTube·X·Discord·Reddit은 공식 영상 정보·개발사 홈페이지·Steam 공지의 주소로 활성화한다. Instagram·TikTok은 미등록으로 비활성화한다. Threads·Bluesky는 기존 일반 링크 영역을 사용한다. Steam 본편 위시리스트와 무료 데모 페이지는 별도 링크다.

## 확인 방법

`web/`에서 `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:render`를 실행한다. 로컬 빌드/QA 서버가 준비되면 `npm.cmd run test:browser:exhibition`으로 PC·모바일의 부스 이미지·영상 배치·SNS 활성/비활성·링크·입력 잠금·종료 시 플레이어 제거를 확인한다. 이 브라우저 검사는 개인 프로필을 쓰지 않으며 외부 트레일러 응답은 대체하므로 실제 YouTube 스트리밍 확인과 구분한다.

전시장 브라우저 검사는 `GAME_BOOTHS`의 각 부스로 실제 키 입력을 통해 걸어가 게임별 제목·로고·썸네일·영상 ID·SNS·관련 링크를 비교한다. 재생 중인 라디오와 개인 음소거도 팝업 개폐 전후 비교한다. 산출물은 `game-booth-<game-id>-<desktop|mobile>.png`, `game-intro-<game-id>-<desktop|mobile>.png`, `game-intro-links-<game-id>-<desktop|mobile>.png`이며 Canvas 렌더는 `showroom-torizon-telecom*.png`를 포함한다.
