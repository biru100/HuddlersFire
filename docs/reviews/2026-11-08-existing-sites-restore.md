# 기존 GPT Sites 복구 근거 (2026-11-08)

- 사용자 최신 요청: 기존 GPT Sites를 새로 만들지 않고 재사용, GitHub/Work 자동화는 유지.
- 원본 호스팅 메타데이터: GitHub `9b893b664e46b5bb8b19e7500816c8672ae094d2` 이전의 `web/.openai/hosting.json`. Site ID와 `DB` 바인딩을 실제 저장소 기록에서 확인.
- 그때의 `web/vite.config.ts`는 `hostingConfig`에서 바인딩을 읽고 Sites Vite 플러그인을 항상 사용했다. `web/scripts/vite/sites-vite-plugin.ts`가 `dist/.openai/hosting.json`과 `dist/.openai/drizzle`을 패키징했다.
- 2026-11-07 직접 배포 전환 `5b0a3b9826e336372be78d6aa01cbd2f38ff0de5`에서 위 파일/빌드 훅이 제거됐다는 diff를 확인했다. 이번 변경은 그 둘을 원위치 복구한다.
- 기존 공개 주소의 과거 기록: `https://huddlers-fire-camp.gywkd77.chatgpt.site` (과거 README 및 Discord OAuth 안내). 현재 게시 URL과 DB 상태는 Sites UI를 통해 다시 확인해야 한다.
- 최신 Sites 패키징 CI 결과는 **이 변경의 실제 GitHub Actions run이 끝난 뒤에만** 기입한다.
- 새 Site/D1 생성, 미승인 아트 적용, Work/Sites의 실제 버전 저장/게시, 공개 주소 및 DB 쓰기는 이 GitHub 소스 수정만으로 수행되지 않는다.
