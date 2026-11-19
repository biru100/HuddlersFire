# HuddlersFire · cross-context current handoff

## 2026-11-20 · 로비 입장과 모바일 대화 v47 운영 게시

08:37 KST에 기존 공개 사이트에 v47을 게시했다. 최종 빌드에서 첫 방문자의 Discord 연결 버튼, 연결 후 방 입장, 모바일 대화 탭과 초안 유지를 확인했다. [게임](https://huddlers-fire-camp.gywkd77.chatgpt.site/) · [운영 검증](../validation.md#sites-v47)

## 2026-11-20 · 로비 입장과 모바일 대화 수정본

v46 디자인 피드백을 반영해 로비 첫 화면에 연결·입장을 배치하고, 모바일 대화 시트의 중복 탐색을 정리했다. 작업 폴더에서 검증한 수정본이며 공개 버전은 v46이다. [화면 비교](../product-review.md) · [검증 기록](../validation.md#astryx-lobby-review)

## 2026-11-20 · Astryx UI v46 운영 게시

08:19 KST에 기존 공개 사이트에 v46을 게시했다. GitHub `main`의 `44cd6c2`에서 Astryx UI를 배포하고 v45의 세 맵 그래픽을 사용했다. 공개 로비의 Astryx CSS와 버전 API가 배포 빌드와 일치한다. [게임 열기](https://huddlers-fire-camp.gywkd77.chatgpt.site/) · [운영 검증](../validation.md#sites-v46)

## 2026-11-20 · 플레이어 UI와 검증 하네스의 Astryx 전환

기준 커밋 `f69d22d`에서 로비·입장·필드 조작·다섯 개 패널·전시 소개·설정·Discord 결과와 PIP의 UI를 Astryx 0.7.16으로 전환했다. SEED와 shadcn의 실행 파일·설정·의존성을 정리했다. 하네스는 한글 입력, 읽던 위치, 테마, 키보드 포커스, 모바일 버튼 대비와 게임·라디오 연결을 검사한다. 최종 결과는 작업 폴더의 로컬 빌드이며 운영 게시 전이다. [전후 화면](../reviews/2026-11-20-astryx-ui.md) · [검증 기록](../validation.md#astryx-ui)

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
