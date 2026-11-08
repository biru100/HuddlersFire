# Discord 계정 연결 설정

새 Discord 개발자 앱은 소유자의 Discord 계정에서 한 번 생성해야 합니다. 현재 웹앱은 `identify` 권한만 요청하며, Discord ID로 입장 자격을 확인하고 프로필 사진을 연결합니다. 방에 들어가려면 계정 연결이 필요하며 특정 Discord 서버 소속은 검사하지 않습니다.

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**을 선택하고 이름을 `Huddlers Fire`로 지정합니다.
2. 앱의 **OAuth2** 설정에 아래 기존 사이트의 Redirect URI가 설정되어 있는지 확인합니다. 기존 Discord 앱을 새로 만들거나 OAuth 값을 초기화하지 않습니다.

   ```text
   https://huddlers-fire-camp.gywkd77.chatgpt.site/api/camp/discord/callback
   ```

3. **Client ID**와 **Client Secret**을 확인합니다. Secret을 복사할 수 없으면 **Reset Secret**으로 새로 발급합니다. 봇 생성이나 서버 초대는 필요하지 않습니다.
4. 프로젝트의 `web/.dev.vars` 파일에 아래 두 값을 입력합니다. 이 파일은 Git 및 배포 소스에서 제외됩니다. 실제 Secret을 채팅이나 소스 코드에 붙여 넣지 마세요.

   ```dotenv
   DISCORD_CLIENT_ID=발급받은_Client_ID
   DISCORD_CLIENT_SECRET=발급받은_Client_Secret
   ```

5. 운영 값은 **기존 GPT Sites**의 Settings에서 `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`을 안전하게 확인·관리한다. 새 Cloudflare Worker나 새 Discord 앱을 만들지 않는다. 기존 사이트 주소는 과거 공개 기록의 주소이며 현재 URL과 기존 OAuth 콜백이 일치하는지 Sites Settings에서 확인한다. Secret을 채팅·Git에 붙여 넣거나 운영 값을 임의 재설정하지 않는다. [Sites 배포 안내](sites-deployment.md)를 따른다.

로컬 인증까지 확인하려면 사용하는 개발 주소의 `/api/camp/discord/callback`도 Redirect URI에 추가합니다. 예: `http://127.0.0.1:5173/api/camp/discord/callback`.

## 완료 확인

- 입장 화면의 **Discord 연결하고 입장 준비** 또는 **설정 → Discord 계정 연결**에서 동의 창이 열립니다.
- 동의를 마치면 원래 캠프장이 유지되고 사진이 표시됩니다. 다른 참여자에게도 다음 로비 갱신 때 사진이 반영됩니다.
- 취소·만료·인증 실패 때 설정 안에 다시 시도할 수 있는 안내가 표시됩니다.
- 연결 해제는 방을 떠난 뒤 가능합니다. 입장 중에는 서버도 해제 요청을 거절합니다.

인증 테스트에는 실제 계정의 동의가 필요합니다. 앱 생성과 서버 자격증명 등록 전에는 실제 Discord 로그인이 완료됐다고 판단하지 않습니다.
