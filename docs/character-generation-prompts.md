# Discord 사진 머리 캐릭터 제작 기준

## 채택한 형태

큰 원형 사진 머리 아래에 목 없이 짧은 배 모양 몸통과 둥근 팔다리를 붙인다. 참가자가 선택한 색을 몸통과 팔다리에 사용한다. 기본형 두 장은 내장 `image_gen` 도구로 각각 생성했으며, 배 모양을 채택했다. 아래쪽 윤곽이 캡슐보다 넓어 앉은 모습과 서 있는 모습을 구분하기 쉽다.

- [배 모양 원본 시안](assets/character-concepts/pear-v1.png)
- [캡슐형 원본 시안](assets/character-concepts/capsule-v1.png)

두 PNG는 투명 배경의 형태 참조 자료다. 게임에서는 `web/lib/camp-character.mjs`의 Canvas 그리기를 사용해 비율과 동작을 일정하게 유지한다. 생성 이미지 자체를 참가자마다 다시 만들지 않는다.

## 머리 사진 합성 규칙

- Discord에서 전달한 프로필 이미지를 사용한다. GPT에 사진을 보내거나 사진 속 인물을 다시 그리지 않는다.
- 이미지 중앙에서 짧은 변을 기준으로 정사각형을 잘라 원 안에 표시한다. 인물 사진과 그림, 로고에 같은 규칙을 적용한다.
- 사진을 좌우 반전하거나 몸통의 자세에 맞춰 찌그러뜨리지 않는다. 앉기와 쪼그리기에서도 머리 반지름은 17로 유지한다.
- 투명 픽셀에는 따뜻한 기본 바탕색을 표시한다. 사진이 있는 경우 기본 얼굴의 눈과 입을 밑에 그리지 않는다.
- 로딩 중이거나 실패한 사진은 기본 얼굴로 대체한다. 같은 URL을 프레임마다 재요청하지 않으며 URL이 바뀌면 새 사진을 불러온다.
- 로비 미리보기와 게임은 같은 그리기 함수를 사용한다.

## 배 모양 생성 요청문

```text
Use case: stylized-concept. Asset type: a reference concept for a tiny 2D social campfire game avatar. Create ONE complete character, centered with generous transparent margins. Head is a large perfectly circular, flat warm ivory blank placeholder, no face, to be replaced later by a Discord profile image. Head overlaps the torso so NO neck is visible. Torso: a short soft PEAR shape, slightly narrower at the top and gently fuller in the lower belly; maximum torso width about 90 percent of head diameter; visible torso height about 85 percent of head diameter. Two short rounded arms with mitten-like hands and two short rounded feet; readable negative space between arms and torso and between feet. Body and limbs use the existing game peach color #e5a76d. A flat 2D cartoon with a consistent dark green-brown outline, minimal one-step shading. Friendly relaxed neutral standing pose, very slight three-quarter view appropriate for an isometric campsite, head circle stays front-facing. No clothes, no accessories, no fingers, no hair, no ears, no anatomical details, no letters, no props, no scenery, no floor shadow, no 3D texture, no realistic anatomy, no checkerboard drawn into image. Genuine alpha transparent background. Original generic proportions, do not reproduce an existing named character.
```

## 캡슐형 생성 요청문

```text
Use case: stylized-concept. Asset type: a reference concept for a tiny 2D social campfire game avatar. Create ONE complete character, centered with generous transparent margins. Head is a large perfectly circular, flat warm ivory blank placeholder, no face, to be replaced later by a Discord profile image. Head overlaps the torso so NO neck is visible. Torso: a short soft CAPSULE shape with almost parallel sides, rounded shoulders and rounded bottom, WITHOUT a wider lower belly; maximum torso width about 90 percent of head diameter; visible torso height about 85 percent of head diameter. Two short rounded arms with mitten-like hands and two short rounded feet; readable negative space between arms and torso and between feet. Body and limbs use the existing game peach color #e5a76d. A flat 2D cartoon with a consistent dark green-brown outline, minimal one-step shading. Friendly relaxed neutral standing pose, very slight three-quarter view appropriate for an isometric campsite, head circle stays front-facing. No clothes, no accessories, no fingers, no hair, no ears, no anatomical details, no letters, no props, no scenery, no floor shadow, no 3D texture, no realistic anatomy, no checkerboard drawn into image. Genuine alpha transparent background. Original generic proportions, do not reproduce an existing named character.
```

## 후속 포즈 생성 시 유지할 조건

후속 생성이 필요하면 채택한 배 모양 PNG를 형태 참조 이미지로 첨부하고 아래 조건을 반복한다. 자세별 추가 비트맵 생성은 현재 구현에 필요하지 않다.

```text
Input image 1: the adopted pear-body concept, used as the shape and style reference.
Change only the pose to [requested pose].
Keep the same circular blank head, torso silhouette, limb thickness, peach color,
outline treatment, viewpoint and transparent background.
Preserve head diameter. Bend the torso and limbs for sitting or crouching;
do not squash the whole character. No face, hair, ears, clothing, props or text.
One complete character with clear margins. Do not add other poses or characters.
```

## 구현과 확인

`camp-character.mjs`가 몸통과 자세, 원형 머리, 이미지 캐시를 담당한다. `camp-renderer.mjs`는 월드 좌표·높이·그림자·이름표를 유지하면서 공통 함수를 호출한다. `character-preview.tsx`도 같은 함수를 사용한다.

`npm.cmd test`는 사진의 중앙 자르기, 자세별 원형 비율, 좌우 원본 유지, 투명 픽셀, 이미지 로딩 실패를 확인한다. `npm.cmd run test:render`는 게임 장면과 `web/outputs/character-profiles.png` 비교 이미지를 만든다. 비교 이미지의 인물형 프로필은 인공 도형 픽스처이며 실제 사용자 사진이 아니다.

원본 시안의 알파 채널, 데스크톱과 모바일 크기, 네 가지 프로필 픽스처, 기본 얼굴, 여섯 참가자 색, 서기·걷기·앉기·쪼그리기·친구 들기와 감정표현을 확인한다. 실제 Discord CDN 요청과 브라우저 UI는 별도의 실행 환경에서 확인할 항목이다.

### 초기 구현 검증 결과

- `npm.cmd test`: 44개 통과. 사진 중앙 자르기, 원형 비율 유지, 반전 방지, 투명 이미지, 캐시와 실패 처리를 포함한다.
- `npm.cmd run typecheck`: 통과.
- `npm.cmd run build`: 통과.
- `npm.cmd run test:render`: 게임 장면 7장과 프로필·동작 비교 이미지 1장 생성 후 시각 확인.
- 새 캐릭터 모듈·미리보기·테스트·렌더 스크립트에 대한 ESLint: 통과.
- 생성 PNG 두 장 모두 투명 알파 픽셀 확인.
- 브라우저 UI 자동화와 실제 계정의 Discord CDN 사진 로딩은 실행하지 않았다. 인증 동작은 기존 자동 테스트가 통과했다.

## 시안의 형태를 동작에 반영

초기 구현의 가는 팔과 별도 손, 납작한 발을 시안의 통통한 형태로 교체했다. 머리 반지름을 14에서 17로 키우고 몸통은 더 짧고 아래가 둥글게 유지해 큰 머리와 작은 몸의 비율을 반영했다. 팔은 어깨부터 손끝까지 이어지는 둥근 곡면이며, 발은 짧고 도톰한 형태다. 몸통과 팔다리에 참가자 색을 바탕으로 밝은 면과 그늘을 넣고, 배 아래 그림자는 몸통 윤곽 안에서 이어지게 한다.

걷기는 교대하는 짧은 발걸음, 작은 좌우 흔들림, 배의 탄성으로 표현한다. 앉기는 배를 넓히고 발을 앞으로 내밀며, 쪼그리기는 몸통을 더 낮추고 발을 바깥으로 벌린다. 인사와 친구 들기는 팔꿈치가 큰 머리 바깥으로 돌아 나오게 한다. 박수·하트·웃음에는 배가 눌리는 작은 반동을, 춤에는 교대하는 팔·발과 몸 기울기를, 놀람에는 위로 펴지는 몸통을 적용한다. 사진 머리는 몸통의 탄성 변형에서 분리해 원형 비율을 보존한다.

- `web/outputs/character-detail-v2.png`: 생성 시안, 개선한 기본형, 사진 머리, 열두 자세, 걷기 여덟 프레임을 비교한다.
- `web/outputs/character-motion-preview.html`: 외부 서비스 연결 없이 열두 동작을 재생한다. 사진 머리 전환, 일시정지, 동작 줄이기를 제공한다.
- `web/outputs/character-before-after.png`: 작업 전 로컬 스냅샷이 있는 경우 이전 형태와 비교한다.

생성 PNG는 원본을 유지했고 새 이미지 생성은 사용하지 않았다. 런타임의 Canvas 곡선·명암·동작을 수정한 작업이다.

검증 결과: 테스트 46개, 타입 검사, 빌드, 변경 코드 ESLint 통과. 데스크톱·모바일·동작 줄이기 장면과 확대 비교 이미지를 Canvas로 렌더링해 확인했다. 로컬 동작 미리보기의 JavaScript 구문도 검사했다. 브라우저 UI 조작과 실제 Discord 계정의 사진 로딩 확인은 실행하지 않았다.
