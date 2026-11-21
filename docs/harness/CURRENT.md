# HuddlersFire · cross-context current handoff

## 2026-11-22 · 새 캠퍼 전체 교체와 기존 Sites v50 게시

사용자 승인에 따라 새 네 방향과 두 헤어·두 의상의 전체 동작을 적용하고 공개 사이트에 v50을 게시했다. [GitHub 검증](https://github.com/biru100/HuddlersFire/actions/runs/44956803921)이 통과했고 공개 빌드 ID와 두 아틀라스의 SHA-256을 확인했다. 기존 공개 범위와 D1 바인딩 및 테이블 구성을 확인했다. [게시 기록](../validation.md#sites-v50) · [공개 게임](https://huddlers-fire-camp.gywkd77.chatgpt.site/)

## 2026-11-22 · 선택된 캠퍼 얼굴로 네 방향과 모션 후보 제작

사용자가 남동향 수정본을 선택하고 귀여움과 예쁨이 읽히는 서브컬처 도트 표현을 요청했다. `subculture-20261122`에 원본과 요청문 9건, 네 방향·네 조합·두 의상의 모션 키, 몸통 전용 보행 64프레임의 표시용 합성을 보관했다. 16개 착용 조합의 공통 얼굴 픽셀과 8프레임 반복 파일을 검사했다. 후속 작업은 착석·표정·제스처의 얼굴/앞손 분리, 하네스용 입력 13장 검증 및 로비·필드에서의 실제 접지·배율·루프 확인이다. [원본과 검토본](../../art/sprites/field-camper-v2/subculture-20261122/manifest.json) · [검증](../validation.md#camper-subculture-lookdev)

## 2026-11-22 · 첫 후보 기각과 남동향 서기 수정

사용자가 첫 후보의 미술 품질 저하를 지적하고 수정을 선택했다. 현행 남동향 원화를 직접 참조한 수정 후보의 원본과 요청문을 저장했다. 눈 하이라이트, 둥근 앞머리, 짧은 상체·다리, 칼라를 1배·3배와 같은 캠프 위치에서 비교했다. 사용자 미술 선택 전 단계이며 나머지 방향·파츠·동작은 이 선택을 기준으로 제작한다. [수정 비교](../../art/sprites/field-camper-v2/lookdev-reference-20261122/standing-comparison.png) · [검증](../validation.md#camper-reference-standing)

## 2026-11-22 · Codex 직접 제작과 첫 서기 후보

사용자 결정에 따라 현행 캠퍼 재생성의 원화와 키포즈를 Codex에서 직접 제작하는 경로로 프로젝트 스킬을 갱신했다. `main`의 로컬 기준 `a5fda8d` 위 작업본에서 네 방향 서기와 공통 머리·두 헤어·두 의상의 원본을 보관하고, 1배·2배 착용표와 같은 캠프 위치의 전후 화면을 만들었다. 첫 서기 기준의 사용자 선택 후 네이티브 파츠, 후속 동작과 아틀라스를 완성한다. 구형 제작·렌더링 경로는 로컬 교체 검증 후 정리한다. [착용 비교](../../art/sprites/field-camper-v2/lookdev-codex-20261122/parts-wardrobe-review.png) · [검증](../validation.md#camper-codex-standing)

## 2026-11-22 · 보행 몸통 전용 아틀라스와 새 원화 수신 준비

`camper-regeneration-v2`에 PNG 13장 입력 목록, 원화 요청서와 현재 캠퍼의 기준 화면을 준비했다. 현행 마스터로 만든 기술 검증용 보행판은 `e3582fc152e8`이며 새 작업에서 고해상도 머리 마스터 3장을 요구하지 않는다. [제작 규격](../../art/sprites/field-camper-v2/README.md) · [검증](../validation.md#camper-body-only-walk)

## 2026-11-21 · 캠퍼 전체 재생성 하네스

모닥불에서 서로를 알아볼 수 있도록 현행 캠퍼의 얼굴·체격·색·접점을 검사하는 제작 흐름을 `sprites:camper`로 묶었다. 최종 후보는 원본 해시와 함께 작업 폴더에 저장하고, 실제 렌더러에서 같은 파일로 검수한다. 기존 마스터는 기본판 `87cc24a01622`와 보행판 `b98c3dcd5c87`를 재현했다. 전체 재생성용 원화 제출과 미술 선택은 대기 중이다. [작업 시작](../../art/sprites/field-camper-v2/README.md#전체-재생성-작업-시작) · [검증](../validation.md#camper-regeneration-harness)

## 2026-11-21 · 캠퍼 확대·축소와 정지·보행 전환

`a5fda8d` 이후 로컬 작업본에서 로비와 초상화는 실제 화면 픽셀 크기에 그린다. 필드는 배율에 맞게 픽셀 경계와 축소를 처리하며, 정지와 걸음에서 같은 방향의 공통 얼굴·헤어를 사용한다. 양쪽 헤어의 내부 명암을 손질한 기본 아틀라스는 `87cc24a01622`다. 이전 기본판 `edad7e0132ce`와 보행판 `b98c3dcd5c87`로 비교할 수 있다. 최종 미술 선택과 운영 게시는 대기 중이다. [검증](../validation.md#camper-scales) · [검토 절차](../art/scene-first-review.md)

## 2026-11-21 · 같은 머리에 얹는 두 헤어

로컬 게임은 `a5fda8d` 이후 작업본의 단발·묶은 머리를 분리된 파츠로 사용한다. 캐릭터 꾸미기, 초상화, 필드와 그림자가 공통 머리를 사용한다. PC·모바일 브라우저 로비에서 네 착용 조합의 얼굴 보호 영역 102픽셀이 일치했다. 3개 맵의 같은 시점 전후 화면도 검증했다. 운영 게시와 최종 미술 선택은 대기 중이다. [검증](../validation.md#shared-camper-head) · [착용표](../../art/sprites/field-camper-v2/shared-head/wardrobe.png)

## 2026-11-21 · 캠퍼 색·크기 규격 및 재생성 검토본

`main`의 `a5fda8d`에서 보행 원화별 머리 폭과 재질색 편차를 재현했다. 같은 얼굴·의상을 알아볼 수 있도록 현행 원본 열 장에서 후보 두 장을 재생성했다. 네 조합, 네 방향, PC·모바일 세 맵의 Canvas 전후를 로컬 검증했다. 후보 미술 선택과 운영 채택은 대기 중이다. [착용 비교](../../art/sprites/field-camper-v2/consistency/wardrobe-comparison.png) · [검증](../validation.md#camper-consistency)

## 2026-11-21 · 기존 Sites에 v49 게시

고해상도 걷기·달리기, 머리와 상의 교차 착용, 모닥불 캠프의 이동 경계와 세 맵 환경을 공개했다. 운영 로비, 방 목록, 빌드 ID와 이미지 11개의 해시가 일치했다. [게임 열기](https://huddlers-fire-camp.gywkd77.chatgpt.site) · [배포 기록](../validation.md#sites-v49)

## 2026-11-21 · 고해상도 걷기 운영 적용 승인

사용자가 교차 착용·고해상도 보행·캠프 경계·환경 수정을 모두 적용하고 게시하도록 승인했다. 실제 게임 렌더러는 네 방향의 걷기와 달리기에서 192×240 머리와 옷을 독립적으로 선택한다. [적용 대상 파일](../reviews/2026-11-21-walk-runtime-release.md)

## 2026-11-21 · 머리와 상의 교차 착용

로비와 게임에서 후디를 입으면 머리가 2~3픽셀 움직이던 문제와 묶은 머리·재킷 조합의 목 옆 잔여 픽셀을 수정했다. 고해상도 보행 검토본도 네 조합 모두 선택한 머리와 상의를 사용한다. PC·모바일 로비의 실제 선택·복원과 세 맵 장면을 로컬에서 검증했다. 운영 게시와 고해상도 보행의 게임 적용은 대기 중이다. [교차 착용 검증](../validation.md#wardrobe-fit)

## 2026-11-21 · 새 걷기 프레임 시트

두 의상의 보행을 네 방향 × 여덟 프레임으로 새로 그렸다. 검토 영상은 192×240 원화에서 직접 그린 캠프 장면과 3배 확대 보행을 보여 준다. 원본, 정렬된 전신 시트와 게임 크기 PNG는 미술 검토용이다. [걷기 시트와 확대 비교](../../art/sprites/field-camper-v2/README.md#2026-11-21--재킷과-후디-걷기-시트)

## 2026-11-20 · 캠프 낙하 제거와 보행·환경 로컬 검증

모닥불 캠프 네 변에서 걷거나 점프해도 필드 안에 머문다. 두 의상의 네 방향 걸음은 실제 이동 거리와 맞고, 세 맵에서 목재·천막·바닥 색과 명암을 조정했다. 로컬 16인 연결과 화면 54쌍으로 검증했다. 운영 버전은 v48이며 새 미술의 최종 선택과 게시는 대기 중이다. [보행 영상과 세 맵 비교](../validation.md#walk-camp-edge)

## 2026-11-20 · 세 맵 환경 v48 운영 게시

13:14 KST에 기존 공개 사이트에 캠프·놀이터·전시장의 지형, 소품, 착석과 그림자 수정을 게시했다. 공개 서버에서 승인된 환경 이미지 17개의 SHA-256과 로비·빌드 버전·공개 방 목록 응답을 확인했다. [공개 게임](https://huddlers-fire-camp.gywkd77.chatgpt.site/) · [검증 기록](../validation.md#sites-v48)

## 2026-11-20 · 세 맵 수정본 운영 사용 승인

사용자가 `8f3289a`의 이미지 17개를 “현재 모습으로 게시”하도록 승인했다. 검토한 이미지의 SHA-256을 배포 후보와 대조했다. [운영 사용 기록](../reviews/2026-11-20-terrain-runtime-release.md) · [검증과 비교 화면](../validation.md#terrain-release-candidate)

## 2026-11-20 · 벤치·울타리·차양의 현행 게임 검토

세 맵에서 수정 전후 54쌍을 실제 게임 렌더러로 비교했다. 제작 도면의 좌면·발·이음점·차양 레이어를 게임이 읽고, 검사기는 어긋난 좌면·잘린 가로대·오래된 증거를 거절한다. 하네스 구현과 로컬 검증을 완료했다. 차양이 얼굴을 가리는 폭과 어두운 좌판의 대비는 사용자 미술 판단을 기다린다. [검증 기록과 대표 화면](../validation.md#current-art-harness)

## 2026-11-20 · 벤치·울타리와 주변 소품 교정

벤치의 두 판재와 네 다리를 캠퍼에 맞춰 다듬고 16개 좌석과 그림자를 같은 도면에 연결했다. 놀이터 울타리 다섯 구간은 2:1 지면에서 일곱 기둥을 공유한다. 캠프와 전시장을 포함한 로컬 게임에서 나머지 시설의 굵은 기둥과 이음선도 조정했다. [같은 카메라 전후 비교](../reviews/2026-11-20-prop-detail.webp) · [검증 기록](../validation.md#prop-detail)

## 2026-11-20 · 배경 픽셀 굵기 로컬 교정

현행 캠퍼의 게임 픽셀을 기준으로 세 맵의 소품·원경 나무·바닥을 재추출하고 벤치 윤곽을 다듬었다. 같은 카메라에서 세 맵을 비교했고 착석·가림·그림자 검사를 다시 통과했다. 로컬 검토본이다. [전후 화면](../reviews/2026-11-20-background-pixel-weight.webp) · [검증 기록](../validation.md#background-pixel-weight)

## 2026-11-20 · 세 맵 시설 접지와 그림자 로컬 구현

`main`의 `b5ccc4a`와 작업 중이던 지형 개편본에서 캠퍼·벤치의 접점, 차양 기둥의 앞뒤 순서, 발판 위 그림자와 소품 재질을 수정했다. 격리 Chrome에서 실제 캠퍼를 사용해 PC·모바일 크기의 WebGL과 Canvas를 각각 확인했다. 미술 최종 선택과 운영 게시는 대기 중이다. [전후 비교](../reviews/2026-11-20-grounding-comparison.webp) · [행동 장면](../reviews/2026-11-20-grounding-actions.webp) · [검증 기록](../validation.md#facility-grounding)

## 2026-11-20 · 로비 입장과 모바일 대화 v47 운영 게시

08:37 KST에 기존 공개 사이트에 v47을 게시했다. 최종 빌드에서 첫 방문자의 Discord 연결 버튼, 연결 후 방 입장, 모바일 대화 탭과 초안 유지를 확인했다. [게임](https://huddlers-fire-camp.gywkd77.chatgpt.site/) · [운영 검증](../validation.md#sites-v47)

## 2026-11-20 · 로비 입장과 모바일 대화 수정본

v46 디자인 피드백을 반영해 로비 첫 화면에 연결·입장을 배치하고, 모바일 대화 시트의 중복 탐색을 정리했다. 작업 폴더에서 검증한 수정본이며 공개 버전은 v46이다. [화면 비교](../product-review.md) · [검증 기록](../validation.md#astryx-lobby-review)

## 2026-11-20 · Astryx UI v46 운영 게시

08:19 KST에 기존 공개 사이트에 v46을 게시했다. GitHub `main`의 `44cd6c2`에서 Astryx UI를 배포하고 v45의 세 맵 그래픽을 사용했다. 공개 로비의 Astryx CSS와 버전 API가 배포 빌드와 일치한다. [게임 열기](https://huddlers-fire-camp.gywkd77.chatgpt.site/) · [운영 검증](../validation.md#sites-v46)

## 2026-11-20 · 플레이어 UI와 검증 하네스의 Astryx 전환

기준 커밋 `f69d22d`에서 로비·입장·필드 조작·다섯 개 패널·전시 소개·설정·Discord 결과와 PIP의 UI를 Astryx 0.7.16으로 전환했다. SEED와 shadcn의 실행 파일·설정·의존성을 정리했다. 하네스는 한글 입력, 읽던 위치, 테마, 키보드 포커스, 모바일 버튼 대비와 게임·라디오 연결을 검사한다. 최종 결과는 작업 폴더의 로컬 빌드이며 운영 게시 전이다. [전후 화면](../reviews/2026-11-20-astryx-ui.md) · [검증 기록](../validation.md#astryx-ui)

## 2026-11-20 · 배경 개편 로컬 검토

기준 소스는 `f69d22d`, 공개 버전은 v45다. 승인된 배경 개선 계획을 작업 폴더에 구현하고 세 맵을 같은 시점에서 비교했다. [불멍 캠프](../reviews/2026-11-20-terrain-camp.jpg) · [놀이터](../reviews/2026-11-20-terrain-playground.jpg) · [전시장](../reviews/2026-11-20-terrain-showroom.jpg). 새 배경의 미술 선택과 게시 결정은 열려 있다. [로컬 검증 기록](../validation.md#terrain-review)

## 2026-11-20 · 세 맵 그래픽과 모바일 대화 v45 게시

사용자의 병합·게시 요청으로 [PR #27](https://github.com/biru100/HuddlersFire/pull/27)을 `main`의 `a9e1c83`에 병합했다. 06:59 KST에 기존 [HuddlersFire](https://huddlers-fire-camp.gywkd77.chatgpt.site/)에 v45가 게시됐다. 공개 릴리스와 세 맵의 그래픽이 해당 빌드와 일치한다. [운영 검증 기록](../validation.md#sites-v45)

## 2026-11-20 · 모바일 밀집 대화와 현재 게시 상태

| 대상 | 확인한 상태 |
| --- | --- |
| GitHub main | `ae37b2e`에 PR #26의 캠퍼·의상·불가 벤치가 들어 있다. |
| 작업 브랜치 | `fix/mobile-camp-readability`의 게임 코드 `0f9b659`는 후속 그래픽 `f8540b3`을 포함한다. 세 맵과 참가자 초상화에 같은 캠퍼 디자인을 사용하며, 모바일에서는 최근 대화와 이름표를 함께 읽고 선택할 수 있다. [수정 전](../reviews/2026-11-20-mobile-chat-before.png) · [수정 후](../reviews/2026-11-20-mobile-chat-after.png) |
| 기존 Sites | v42의 게시 성공을 확인했다. v43·v44는 저장됐으며 조회 당시 두 버전 모두 게시 ID가 없었다. 저장본 v44와 그래픽 브랜치의 소스 일치 여부는 미확인이다. |

위 표는 PR #27 병합 전 상태를 기록한 것이다. [검증 기록](../validation.md)

## 2026-11-20 · Camper-led art and portraits

The current camper anchors the landscape materials, shelters, interactive props, benches, fire animation, item effects and UI portraits. The [release record](../reviews/2026-11-20-camper-style.md) includes the scene captures and build command.

## 2026-11-20 · Three landscapes, camp shadows and character faces

The follow-up release uses illustrated terrain and scenery on all three maps, matches ground shadows to the light and removes Discord portraits from the character painter and lobby preview. The original source images, processing scripts, three-map render command and shipped asset hashes are in the [landscape release record](../reviews/2026-11-20-landscape-release.md).

## 2026-11-20 · Runtime camp artwork

The user requested the complete camp-art revision and publication to the existing Site. The release adds a direction-aware camper, selectable hair and clothing, seated and moving poses, timber benches and fire-circle ground. For current evidence run the [production scene capture](../art/scene-first-review.md). See the [390px view from the production renderer](../reviews/2026-11-20-camp-live-mobile.png). The earlier dated receipts below describe review-time state. Site publication is tracked separately by its saved version and deployment result.

## 2026-11-20 · First camp scene review

The active art task is the [scene-first workflow](../art/scene-first-review.md). Inspect the [current candidate, evidence and limits](../../art/sprites/scene-reviews/camp-circle-se/README.md) at actual mobile and desktop scale. The candidate is pending user selection. Character customization and Idle follow selection. Both earlier rejected canvas sizes now have verified file receipts. The older entries below record their respective dates.

### 2026-11-16 하네스 초안 당시 기록

아래의 초안 상태와 제안은 당시 브랜치 기준이다. [PR #21](https://github.com/biru100/HuddlersFire/pull/21)은 이후 main에 병합됐다.

## Product North Star

Online camp for indie-game developers to **rest, play, co-work and share games together**. The project's harness supports the entire game and the quality of that experience. Sprite creation is one initiative, never the system's center. Canonical decisions: [project-intent](../project-intent.md); mapping: [intent tree](INTENT_TREE.md).

## What is known, not inferred

- Repository: `biru100/HuddlersFire`, default `main`; existing GPT Sites project is `appgprj_6ae8e9ae42708191b253341387aa287f`, DB `DB`. **No new site, DB, Cloudflare direct deployment or unapproved paid image API.**
- [Validation](../validation.md) records the release from [PR #15](https://github.com/biru100/HuddlersFire/pull/15) and documents **v41 publication on 2026-11-09 KST** to the original Site, with non-destructive data checks. This is last recorded verification, **not a live check on 2026-11-16**.
- Prior NW Idle exploration: [PR #7](https://github.com/biru100/HuddlersFire/pull/7) open and conflicted; [PR #19](https://github.com/biru100/HuddlersFire/pull/19) reference 2×2 draft; [PR #20](https://github.com/biru100/HuddlersFire/pull/20) technical 16-frame draft stacked on #7; [PR #17](https://github.com/biru100/HuddlersFire/pull/17) proves Chat PNG transfer, not art acceptance. None of these are approved NW runtime animation.
- Product branches already described in [product direction](../product-direction.md): camp/rest, playground/play, work/status/presence, indie-game exhibits. Cross-cutting visual quality, UX/access, multiplayer reliability and release safety support all of them.

## User decisions newly confirmed 2026-11-16

1. Project harness must follow **L0 product purpose → L1 sub-intents → L2 outcomes and engineering quality → L3 initiatives → L4 tasks**, independent of active chat. Do not optimize the entire harness for a single frame.
2. Current art **pilot**, subordinate to `HF-REST.PRESENCE`: an obviously visible, cute breathing motion.
3. ChatGPT may design concepts/key poses; Work/Codex **may directly edit derivative pixel art and motion**, but **user retains final art approval**.
4. Start with **64×96** native pixels, adjustable after actual game-size inspection.
5. First finish **NW Idle one**; create basic layers first, validate on one character, do not mass-produce views/clothing.

The implementation sequence and intentionally distinct non-art pilot are in [ROADMAP](ROADMAP.md). The player-feedback/quality review method is in [PRODUCT_LOOP](PRODUCT_LOOP.md).

## Current work and proposals

**Project-harness restructuring:** review PR #21 and its current checks. Use the [roadmap](ROADMAP.md) for proposed follow-ups. The next action comes from the current request, an authorized PR/issue, and its verified state. With no authorized action, report the current state without starting a roadmap item.

**Art pilot:** first create a native NW base/controlled key poses, visually review at 1× and in-game, only then generate intermediate frames. The prior 7-PR art-only plan is **superseded as a global roadmap**; task-specific details can be reused after governance review.

## Current explicit restrictions

- Do not replace the approved original binaries with derivatives or promote historical reference art to approved runtime.
- No silent production deploy, database migration/destructive writes, new paid services, site replacement or duplicated Work PR automation.
- Do not claim real-world browser/NAT/Discord OAuth/mobile compatibility from Node loopback CI.
- Do not infer user sign-off from a document, generated image, PR or green test.
- Project-specific changes stay in this repo; the separate personal reusable AI harness is not modified by this initiative.

## Next action for this draft

For PR #21, review the exact head and its checks. Merge authorization remains separate. For other tasks, use the current request and applicable approval record. The older #7 F2 entry in the Work queue describes that branch’s specialized job. It does not select the next project task or authorize the new pilot.

## Scoped art update · 2026-11-18 KST

[PR #24](https://github.com/biru100/HuddlersFire/pull/24) introduces the user-authorized clean-room art pilot. Its [task record](tasks/HF-ART-CLEANROOM-20261118.md) and [pipeline](../art/pixel-ai-pipeline-v3.md) supersede the old-avatar-first sequence for this new design. Preflight verification and tool audit are recorded. Native-model and general-model/alignment lanes remain blocked by unavailable providers/tools. Two new manual-native PNG candidates (48×64 and 64×96) were subsequently submitted on PR #24 and verified from GitHub. Both were visually rejected by the user on 2026-11-18 because they differ substantially from the desired concept. The manual_native receipt records rejected_visual; both files are preserved as rejected history. The submitting author declares text-only independent drawings. Editable layers and the creation script have not been committed, so that creative process cannot yet be reproduced from GitHub. All art/runtime/release gates remain pending. Restore the exact current PR head and its durable Work handoff for technical results. The next art step is a new text-only concept proposal addressing the failed proportions, shading and character appeal. These rejected candidates cannot serve as references or as a basis for parts or animation. No replacement candidate or new provider invocation is authorized by this status update.
