# HuddlersFire project instructions

## Project-only configuration
- 이 프로젝트 작업 중에는 전역 규칙과 설정을 수정하지 않는다. `C:\Users\user\.codex\AGENTS.md`, 전역 Codex 설정, 사용자 공통 스킬·하네스 설정 등이 포함된다.
- 필요한 규칙과 설정은 HuddlersFire 프로젝트 내부에만 추가하거나 변경한다.

## Select skills
- 프로젝트 로컬 스킬은 `.agents/skills/`에 둔다. 요청에 필요한 스킬만 선택하고, 적용 전에 해당 `SKILL.md`를 읽는다.
- **plan-interview**: [계획 전 의도 인터뷰](.agents/skills/plan-interview/SKILL.md). 실제 계획 모드이거나 사용자가 `/plan`, `./plan`, `$plan-interview` 또는 명시적인 요구사항 인터뷰를 요청할 때 적용한다.
- 일반 구현·단순 질문·명령 사용법 설명·문자열 인용에는 계획 인터뷰를 자동으로 추가하지 않는다.
- AgentHub에서는 현재 세션의 질문 허용 조건·질문 블록 형식·개수 제한·턴 종료 규칙을 우선한다.

## Computer-use default
- 이 프로젝트에서는 computer-use 스킬, cua_repl / sky 등 컴퓨터 제어 도구, 데스크톱 앱 및 개인 브라우저 UI 조작을 기본적으로 사용하지 않는다.
- 사용자가 현재 작업에서 UI 자동화를 명시적으로 요청한 경우에만 사용한다. 일반적인 구현·테스트·미리보기·배포 요청은 computer-use 사용 허가로 간주하지 않는다.
- 소스 확인, CLI, API, 사용자 UI를 조작하지 않는 자동화 테스트를 우선한다. 화면 확인이 불가능하면 그 한계를 명시하고 나머지 작업을 완료한다.
