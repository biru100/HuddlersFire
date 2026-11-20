# HuddlersFire project instructions

## 2026-11-20 · Scene-first art review

Choose the task in the [scene-first art workflow](docs/art/scene-first-review.md). For revisions around the current camper, capture the shipped local art before editing and pair it with the same playable scenes afterwards. For a new visual direction, submit a fresh text-only standing camper, bench and ground patch together. Use a historical receipt to reproduce that submission only. Record aesthetic selection and runtime verification separately.

## 2026-11-18 · New clean-room pixel art experiment (latest user instruction, ART DOMAIN ONLY)

The whole game still follows [project intent](docs/project-intent.md). For NEW visual direction, use the scoped [pixel AI pipeline v3](docs/art/pixel-ai-pipeline-v3.md), positive-only [creative prompt](docs/briefs/cleanroom-pixel-generation-20261118.txt), and [camp-pixel-cleanroom](.agents/skills/camp-pixel-cleanroom/SKILL.md). **Do not feed, open or condition on any older PNG, past image, screenshot, lookdev, palette, prior art hash, art model-training record or prior generated candidate** when producing the new clean-room design. Historical archives stay intact for rollback. Old styleReference / Rounded-02 / CORE03 tasks are past *separate scopes* and must not be auto-loaded into this new design.

Current exploratory product art target: casual true pixel art, approx 2–2.5-head body proportions, modular hair/clothing, balanced all-map B social-quarterview on the existing 2:1 world projection. One native character concept first, **64×96 versus 48×64 as unapproved trial candidates**, evaluate three independent lanes only when provider capabilities and cost are confirmed. Retro Diffusion Plus is proposed, NOT connected or approved for paid generation. No automatic art approval, merge, runtime replacement or production publish. Non-art tasks do not inherit any pixel-specific gate.

## Project-wide intent-first harness (2026-11-16 · latest user direction)

**This repository is the harness for the entire HuddlersFire game**, not an NW Idle/sprite-production harness. The overarching purpose is a warm online camp for indie-game developers to rest, play, work together and share games. **Every task** must trace L0 product purpose → L1 player experience → L2 desired effect/quality → L3 initiative → L4 verifiable work. Do not impose art-only processes on networking, gameplay, UX, community or operations.

**Starting a new Chat/Work/Codex/other-AI context:** read [user intent decisions](docs/project-intent.md), [project harness entry](docs/harness/README.md), [intent tree](docs/harness/INTENT_TREE.md), [current handoff](docs/harness/CURRENT.md), then route the task using [work protocol](docs/harness/WORK_PROTOCOL.md). Confirm exact repository HEAD, PR state and evidence instead of assuming previous chats share memory. Preserve latest user decisions across contexts by updating the canonical decision ledger and dated handoff.

**Newest art delegation decision:** ChatGPT designs concepts and key poses; Work/Codex **may directly author/edit derivative native pixel assets and motion** within the user's authorized scope. Only the user can give final aesthetic approval. Approved original PNG bytes stay immutable. The 64×96 NW cute-breathing Idle is one initial subordinate pilot, not a universal frame count, shape-lock, approval gate or roadmap. Previous narrower instructions that forbid all Codex pixel editing are superseded in this limited way.

Product intent and independent domain-level QA outrank the number of art files, CI successes, frames and PRs. For a domain task, use only its relevant skill. General router: [.agents/skills/huddlersfire-project-operator/SKILL.md](.agents/skills/huddlersfire-project-operator/SKILL.md). Existing site/DB/Discord preservation, no paid APIs, no automatic art approval and no unapproved live publication remain unchanged.

## Project-only configuration
- 이 프로젝트 작업 중에는 전역 규칙과 설정을 수정하지 않는다. `C:\Users\user\.codex\AGENTS.md`, 전역 Codex 설정, 사용자 공통 스킬·하네스 설정 등이 포함된다.
- 필요한 규칙과 설정은 HuddlersFire 프로젝트 내부에만 추가하거나 변경한다.

## Existing ChatGPT Sites hosting, GitHub + Work (2026-11-08 latest decision)
- 사용자는 이전 Cloudflare 직접 배포 결정을 대체하여 **기존 GPT Sites 프로젝트 재사용**을 명시했다. [Sites 배포](docs/sites-deployment.md), [Work 인계](docs/automation/AGENT_HANDOFF.md), [정책](docs/automation/POLICY.json)을 우선한다.
- 기존 프로젝트는 `web/.openai/hosting.json`의 project_id이며 `d1: DB`, `r2: null`이다. **새 사이트/DB/URL 생성, 기존 사이트/DB 삭제/이전, 무단 migration 금지.** URL·저장 데이터·Discord 인증 설정을 보존한다.
- GitHub Actions는 [검증 전용](.github/workflows/deploy.yml)이다. 기존 Cloudflare 계정/Worker/D1 GitHub Secrets를 설정하라고 요구하거나 Cloudflare 직접 게시를 실행하지 않는다.
- Sites의 **버전 저장과 기존 Site에 게시**는 ChatGPT Work/Sites에서 한다. 검증된 main commit을 선택하고 원본·미술·DB 호환성을 확인한 뒤 리뷰용 버전을 먼저 저장한다. CI success/manifest 복구를 Sites 배포 성공으로 보고하지 않는다.
- GitHub 원본·SHA·PR·Work 이벤트는 그대로 사용한다. 이미지/모션 미술 승인, 네이티브/런타임 선택, 저장된 Sites 버전 확인과 운영 게시 결과는 각각 독립적이다. 운영 Secret은 Sites Settings에서만 관리한다.

## Artwork and asset work

Use [visual production](docs/visual-production.md) for asset contracts, [image handoff](docs/automation/IMAGE_HANDOFF.md) for Chat originals, and the relevant [project skill](docs/harness/README.md) for production or review. Preserve original PNG bytes and provenance. Work/Codex may edit derivatives within the authorized task. Final art selection belongs to the user. For Rounded 02, follow the [design approval](docs/reviews/2026-11-07-rounded02-rev2-art-approval.md) and [motion handoff](docs/briefs/rounded-02/animation-idle-handoff.md) for the distinct design, motion, native and runtime gates.

## Product context
- 신규 그래픽 목표는 INT-24의 픽셀 쿼터뷰다. 기존 원화는 승인 전까지 기본값/롤백 경로다. 부족한 방향/포즈/레이어를 자동 반전·리사이즈로 완성 처리하지 않는다.
- 제품 판단 전 [의도 기준](docs/project-intent.md)의 확정·관찰·제안·보류·대체됨을 구분한다. [제품 방향](docs/product-direction.md)은 경험과 현재 범위를 설명한다.
- 최신 사용자 결정이 기존 기준을 바꾸면 관련 의도와 계약·검사를 함께 갱신한다. AI의 선호나 측정 자료만으로 목적을 변경하지 않는다. 충돌은 의도 기준의 절차를 따르고 이미 받은 답·승인을 되묻지 않는다.
- 현재 모듈·상태 계약은 [구조 문서](docs/architecture.md), 남은 의도 차이는 [제품 검토](docs/product-review.md), 실행 결과는 [검증 기록](docs/validation.md)을 본다. `docs/plan.md`의 과거 결정을 현재 동작으로 취급하지 않는다.
- 자산·배치·카메라·UI의 시각 변경은 영향받는 [장면 구성 기준](docs/scene-composition.md)을 적용한다. 실제 합성 화면이 미확인인 부분을 시각 재구성 완료로 보고하지 않는다.
- 기존 일러스트의 무손실 재현·재패킹 방법은 [기존 제작 경로](docs/sprite-authoring.md)를 보존한다. 과거 명령이 출력하는 NW 요청문은 새 미술 기준 선택을 대신하지 않는다.

## Select skills
- **huddlersfire-project-operator**: 프로젝트 전체의 최상위 의도·작업 라우팅·컨텍스트 인계. 특정 분야의 하위 스킬보다 먼저 의도를 복원한다. [프로젝트 운영 스킬](.agents/skills/huddlersfire-project-operator/SKILL.md).
- 프로젝트 로컬 스킬은 `.agents/skills/`에 둔다. 요청에 필요한 스킬만 선택하고, 적용 전에 해당 `SKILL.md`를 읽는다.
- **camp-art-direction**: [미술 방향·외부 생성 요청](.agents/skills/camp-art-direction/SKILL.md). 스타일/품질 개선, 기준 캐릭터 선정, ChatGPT 이미지 요청·수신에 적용한다. 미술 승인 전에 대량 리소스를 생산하지 않는다.
- **camp-sprite-assets**: [수신 원화·조립·스프라이트 검수](.agents/skills/camp-sprite-assets/SKILL.md). 승인된 방향을 게임용 자산으로 연결하고 실제 장면에서 확인한다. 직접 생성의 기본 경로가 아니다.
- **plan-interview**: 계획만 요청하거나 `/plan`, `./plan`, `$plan-interview`, 명시적인 요구사항 인터뷰를 요청할 때 공통 `plan-interview` 스킬을 적용한다. 프로젝트 의도·기존 사용자 답과 현재 세션의 질문 규칙을 함께 따른다. 프로젝트 전용 `camp-plan-interview`는 사용자의 요청으로 제거했다.
- 일반 구현·단순 질문·명령 사용법 설명·문자열 인용에는 계획 인터뷰를 자동으로 추가하지 않는다.
- **camp-add-game-booth**: [게임 전시 부스 추가·갱신](.agents/skills/camp-add-game-booth/SKILL.md). 공식 자료와 공통 템플릿을 사용한다.
- **camp-product-review**: [제품 의도와 구현 검토](.agents/skills/camp-product-review/SKILL.md). 제품 방향 검토 요청 또는 기능 묶음 완료 시 실제 흐름을 의도와 대조한다. 사소한 수정마다 전체 감사·인터뷰를 강제하지 않는다.
- **camp-change-validation**: [변경·회귀·배포 검증](.agents/skills/camp-change-validation/SKILL.md). 변경 범위에 맞는 검사를 수행한다. 하네스 변경에는 `web/`의 `npm run test:art-direction`도 포함한다. 전체 빌드/렌더 미실행은 따로 기록한다.
- AgentHub에서는 현재 세션의 질문 허용 조건·질문 블록 형식·개수 제한·턴 종료 규칙을 우선한다.
- 계획만 요청된 작업은 문서·스킬을 포함해 파일이나 외부 상태를 변경하지 않는다. 구현 승인을 배포 권한으로 확대하지 않는다. 이번 명시적 사이트 자동화 요청은 검증된 배포를 허용하며 미술/DB/비용 승인은 분리한다.

## Computer-use default
- 이 프로젝트에서는 computer-use 스킬, cua_repl / sky 등 컴퓨터 제어 도구, 데스크톱 앱 및 개인 브라우저 UI 조작을 기본적으로 사용하지 않는다.
- 사용자가 현재 작업에서 UI 자동화를 명시적으로 요청한 경우에만 사용한다. 일반적인 구현·테스트·미리보기·배포 요청은 computer-use 사용 허가로 간주하지 않는다.
- 소스 확인, CLI, API, 사용자 UI를 조작하지 않는 자동화 테스트를 우선한다. 화면 확인이 불가능하면 그 한계를 명시하고 나머지 작업을 완료한다.
