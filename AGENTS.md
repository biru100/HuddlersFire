# HuddlersFire project instructions

## Project-only configuration
- 이 프로젝트 작업 중에는 전역 규칙과 설정을 수정하지 않는다. `C:\Users\user\.codex\AGENTS.md`, 전역 Codex 설정, 사용자 공통 스킬·하네스 설정 등이 포함된다.
- 필요한 규칙과 설정은 HuddlersFire 프로젝트 내부에만 추가하거나 변경한다.

## Product context
- 제품 판단 전 [의도 기준](docs/project-intent.md)의 확정·관찰·제안·보류·대체됨을 구분한다. [제품 방향](docs/product-direction.md)은 경험과 현재 범위를 설명한다.
- 최신 사용자 결정이 기존 기준을 바꾸면 관련 의도와 계약·검사를 함께 갱신한다. AI의 선호나 측정 자료만으로 목적을 변경하지 않는다. 충돌은 의도 기준의 절차를 따르고 이미 받은 답·승인을 되묻지 않는다.
- 현재 모듈·상태 계약은 [구조 문서](docs/architecture.md), 남은 의도 차이는 [제품 검토](docs/product-review.md), 실행 결과는 [검증 기록](docs/validation.md)을 본다. `docs/plan.md`의 과거 결정을 현재 동작으로 취급하지 않는다.

## Select skills
- 프로젝트 로컬 스킬은 `.agents/skills/`에 둔다. 요청에 필요한 스킬만 선택하고, 적용 전에 해당 `SKILL.md`를 읽는다.
- **camp-plan-interview**: [프로젝트 계획 전 의도 인터뷰](.agents/skills/camp-plan-interview/SKILL.md). 계획만 요청하거나 `/plan`, `./plan`, `$camp-plan-interview`, 명시적인 요구사항 인터뷰를 요청할 때 적용한다. 이 프로젝트에서 예전 `$plan-interview` 호출도 이 로컬 절차로 해석한다.
- 일반 구현·단순 질문·명령 사용법 설명·문자열 인용에는 계획 인터뷰를 자동으로 추가하지 않는다.
- **camp-product-review**: [제품 의도와 구현 검토](.agents/skills/camp-product-review/SKILL.md). 제품 방향 검토 요청 또는 기능 묶음 완료 시 실제 흐름을 의도와 대조한다. 사소한 수정마다 전체 감사·인터뷰를 강제하지 않는다.
- **camp-change-validation**: [변경·회귀·배포 검증](.agents/skills/camp-change-validation/SKILL.md). 게임·연결·UI 변경의 검증과 배포 준비에 적용한다. 문서만 바뀌면 문서와 스킬에 맞는 검사로 한정한다.
- AgentHub에서는 현재 세션의 질문 허용 조건·질문 블록 형식·개수 제한·턴 종료 규칙을 우선한다.
- 계획만 요청된 작업은 문서·스킬을 포함해 파일이나 외부 상태를 변경하지 않는다. 구현 승인을 받으면 승인 범위의 수정·검증을 진행하며 배포 권한으로 확대하지 않는다.

## Computer-use default
- 이 프로젝트에서는 computer-use 스킬, cua_repl / sky 등 컴퓨터 제어 도구, 데스크톱 앱 및 개인 브라우저 UI 조작을 기본적으로 사용하지 않는다.
- 사용자가 현재 작업에서 UI 자동화를 명시적으로 요청한 경우에만 사용한다. 일반적인 구현·테스트·미리보기·배포 요청은 computer-use 사용 허가로 간주하지 않는다.
- 소스 확인, CLI, API, 사용자 UI를 조작하지 않는 자동화 테스트를 우선한다. 화면 확인이 불가능하면 그 한계를 명시하고 나머지 작업을 완료한다.
