# Discord 프로필 연결 설정

새 Discord 개발자 앱은 소유자의 Discord 계정에서 한 번 생성해야 합니다. 현재 웹앱은 `identify` 권한만 요청하며, Discord ID와 프로필 사진만 연결합니다.

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**을 선택하고 이름을 `Huddlers Fire`로 지정합니다.
2. 앱의 **OAuth2** 설정에 아래 Redirect URI를 정확히 등록하고 저장합니다.

   ```text
   https://huddlers-fire-camp.gywkd77.chatgpt.site/api/camp/discord/callback
   ```

3. **Client ID**와 **Client Secret**을 확인합니다. Secret을 복사할 수 없으면 **Reset Secret**으로 새로 발급합니다. 봇 생성이나 서버 초대는 필요하지 않습니다.
4. 프로젝트의 `web/.dev.vars` 파일에 아래 두 값을 입력합니다. 이 파일은 Git 및 배포 소스에서 제외됩니다. 실제 Secret을 채팅이나 소스 코드에 붙여 넣지 마세요.

   ```dotenv
   DISCORD_CLIENT_ID=발급받은_Client_ID
   DISCORD_CLIENT_SECRET=발급받은_Client_Secret
   ```

5. 값 등록이 끝나면 이 작업의 에이전트에게 알려 주세요. 에이전트는 값을 출력하지 않고 Sites의 서버 환경 변수에 비밀 값으로 등록하고 새 버전을 배포합니다. 로컬 파일에만 값을 넣으면 운영 사이트에는 적용되지 않습니다.

로컬 인증까지 확인하려면 사용하는 개발 주소의 `/api/camp/discord/callback`도 Redirect URI에 추가합니다. 예: `http://127.0.0.1:5173/api/camp/discord/callback`.

## 완료 확인

- 사이트의 **설정 → Discord 프로필 연결**에서 동의 창이 열립니다.
- 동의를 마치면 원래 캠프장이 유지되고 사진이 표시됩니다. 다른 참여자에게도 다음 로비 갱신 때 사진이 반영됩니다.
- 취소·만료·인증 실패 때 설정 안에 다시 시도할 수 있는 안내가 표시됩니다.
- 연결 해제 시 현재 방의 사진도 제거됩니다.

인증 테스트에는 실제 계정의 동의가 필요합니다. 앱 생성과 서버 자격증명 등록 전에는 실제 Discord 로그인이 완료됐다고 판단하지 않습니다.
