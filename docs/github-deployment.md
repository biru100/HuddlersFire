# GitHub 소스 검증, GPT Sites에 배포

**2026-11-08 최신 결정:** 기존 ChatGPT GPT Sites를 재사용한다. 이전 Cloudflare Workers/D1 직접 배포는 중단했다.

운영 인계 및 기존 프로젝트 보존: **[docs/sites-deployment.md](sites-deployment.md)**

GitHub Actions는 코드·이미지 수신·타입·빌드·패키지 무결성을 검사한다. `main` push는 사이트를 게시하지 않는다. 기존 GPT Sites의 version save / deploy는 Work/Sites 관리 기능이 담당하며, 기존 DB·공개 URL·OAuth·사이트 접근권한을 유지한다. 외부 Cloudflare 토큰 및 CAMP_PRODUCTION_READY 설정은 더 이상 필요하지 않다.

과거 GitHub 직접 배포의 실패 및 전환 이력은 [2026-11-07 검증 기록](reviews/2026-11-07-github-deployment-validation.md)과 GitHub Issue #9를 참고한다. 이는 현재 운영 지침이 아니다.
