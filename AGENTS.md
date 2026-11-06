# HuddlersFire project instructions

## Project-only configuration
- 이 프로젝트 작업 중에는 전역 규칙과 설정을 수정하지 않는다. `C:\Users\user\.codex\AGENTS.md`, 전역 Codex 설정, 사용자 공통 스킬·하네스 설정 등이 포함된다.
- 필요한 규칙과 설정은 HuddlersFire 프로젝트 내부에만 추가하거나 변경한다.

## Current graphics workflow
- 신규 픽셀 제작의 활성 경로는 [시각 제작](docs/visual-production.md)과 `art/sprites/art-direction.json`이다. 과거 생성·정규화 절차보다 이 경로를 먼저 적용한다. 정확한 투영·캔버스 제안은 기존 `scene-spec.json.pixelQuarterview`에서만 읽는다.
- 미술 원화는 사용자가 지정한 ChatGPT 이미지 제작 경로로 요청하고, Codex는 요청서·수신·조립·검수를 담당한다. 내장 imagegen이나 유료 API를 조용히 대신 호출하지 않는다. 요청 모델과 실제 확인 모델은 분리하며 관찰할 수 없으면 `unverified`다.
- 현재 승인된 픽셀 미술 기준은 없다. 과거 시트, 6색 파생본, 코드로 그린 NW 신체를 기준작으로 자동 승격하지 않는다. 착의 캐릭터 시안을 먼저 선택하고 NW 기본 신체, 소수 레이어, 실제 캠프 순서로 확인한다.
- `--art`는 시안/단일 원화 검토, `--pixel`은 기존 조립/장면 검사다. 두 경로는 동일 prepare → rebuild → render → review 명령을 사용한다. 시안 승인, 네이티브 규격 통과, 게임 장면 승인을 서로 대신하지 않는다.
- 큰 생성물을 64×96로 강제 축소·양자화하거나 Python/SVG 도형으로 다시 그려 원화 생성 성공처럼 보고하지 않는다. 네이티브 납품이 안 되면 `blocked_native_delivery`로 보존하고 제작 방식의 결정을 분리한다.

## Product context
- 신규 그래픽 목표는 INT-24의 픽셀 쿼터뷰다. 기존 원화는 승인 전까지 기본값/롤백 경로다. 부족한 방향/포즈/레이어를 자동 반전·리사이즈로 완성 처리하지 않는다.
- 제품 판단 전 [의도 기준](docs/project-intent.md)의 확정·관찰·제안·보류·대체됨을 구분한다. [제품 방향](docs/product-direction.md)은 경험과 현재 범위를 설명한다.
- 최신 사용자 결정이 기존 기준을 바꾸면 관련 의도와 계약·검사를 함께 갱신한다. AI의 선호나 측정 자료만으로 목적을 변경하지 않는다. 충돌은 의도 기준의 절차를 따르고 이미 받은 답·승인을 되묻지 않는다.
- 현재 모듈·상태 계약은 [구조 문서](docs/architecture.md), 남은 의도 차이는 [제품 검토](docs/product-review.md), 실행 결과는 [검증 기록](docs/validation.md)을 본다. `docs/plan.md`의 과거 결정을 현재 동작으로 취급하지 않는다.
- 자산·배치·카메라·UI의 시각 변경은 영향받는 [장면 구성 기준](docs/scene-composition.md)을 적용한다. 실제 합성 화면이 미확인인 부분을 시각 재구성 완료로 보고하지 않는다.
- 기존 일러스트의 무손실 재현·재패킹 방법은 [기존 제작 경로](docs/sprite-authoring.md)를 보존한다. 과거 명령이 출력하는 NW 요청문은 새 미술 기준 선택을 대신하지 않는다.

## Select skills
- 프로젝트 로컬 스킬은 `.agents/skills/`에 둔다. 요청에 필요한 스킬만 선택하고, 적용 전에 해당 `SKILL.md`를 읽는다.
- **camp-art-direction**: [미술 방향·외부 생성 요청](.agents/skills/camp-art-direction/SKILL.md). 스타일/품질 개선, 기준 캐릭터 선정, ChatGPT 이미지 요청·수신에 적용한다. 미술 승인 전에 대량 리소스를 생산하지 않는다.
- **camp-sprite-assets**: [수신 원화·조립·스프라이트 검수](.agents/skills/camp-sprite-assets/SKILL.md). 승인된 방향을 게임용 자산으로 연결하고 실제 장면에서 확인한다. 직접 생성의 기본 경로가 아니다.
- **plan-interview**: 계획만 요청하거나 `/plan`, `./plan`, `$plan-interview`, 명시적인 요구사항 인터뷰를 요청할 때 공통 `plan-interview` 스킬을 적용한다. 프로젝트 의도·기존 사용자 답과 현재 세션의 질문 규칙을 함께 따른다. 프로젝트 전용 `camp-plan-interview`는 사용자의 요청으로 제거했다.
- 일반 구현·단순 질문·명령 사용법 설명·문자열 인용에는 계획 인터뷰를 자동으로 추가하지 않는다.
- **camp-add-game-booth**: [게임 전시 부스 추가·갱신](.agents/skills/camp-add-game-booth/SKILL.md). 공식 자료와 공통 템플릿을 사용한다.
- **camp-product-review**: [제품 의도와 구현 검토](.agents/skills/camp-product-review/SKILL.md). 제품 방향 검토 요청 또는 기능 묶음 완료 시 실제 흐름을 의도와 대조한다. 사소한 수정마다 전체 감사·인터뷰를 강제하지 않는다.
- **camp-change-validation**: [변경·회귀·배포 검증](.agents/skills/camp-change-validation/SKILL.md). 변경 범위에 맞는 검사를 수행한다. 하네스 변경에는 `web/`의 `npm run test:art-direction`도 포함한다. 전체 빌드/렌더 미실행은 따로 기록한다.
- AgentHub에서는 현재 세션의 질문 허용 조건·질문 블록 형식·개수 제한·턴 종료 규칙을 우선한다.
- 계획만 요청된 작업은 문서·스킬을 포함해 파일이나 외부 상태를 변경하지 않는다. 구현 승인을 배포 권한으로 확대하지 않는다.

## Computer-use default
- 이 프로젝트에서는 computer-use 스킬, cua_repl / sky 등 컴퓨터 제어 도구, 데스크톱 앱 및 개인 브라우저 UI 조작을 기본적으로 사용하지 않는다.
- 사용자가 현재 작업에서 UI 자동화를 명시적으로 요청한 경우에만 사용한다. 일반적인 구현·테스트·미리보기·배포 요청은 computer-use 사용 허가로 간주하지 않는다.
- 소스 확인, CLI, API, 사용자 UI를 조작하지 않는 자동화 테스트를 우선한다. 화면 확인이 불가능하면 그 한계를 명시하고 나머지 작업을 완료한다.
