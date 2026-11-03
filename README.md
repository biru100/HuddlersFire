# HuddlersFire · 허들러즈 불멍

친구들과 함께 머무는 웹 기반 2D 쿼터뷰 캠프장입니다. 최대 16명이 코드로 입장하며, 게임 상태는 방장을 중심으로 WebRTC DataChannel로 동기화합니다.

배포 사이트: [허들러즈 불멍](https://huddlers-fire-camp.gywkd77.chatgpt.site). 2026-11-03 배포 준비 시 확인한 기존 접근 설정은 공개이며, 업데이트 배포에서도 이 설정을 유지합니다.

## 구현 범위

- WASD / 방향키 이동, 화면 기준 방향, 모닥불·나무·텐트 충돌
- E 키로 앉기·일어서기, 모닥불 애니메이션과 합성 환경음·음량 조절
- Shift 웅크리기·티배깅, Q/숫자키 감정표현 6종, 키보드·터치 동작 버튼
- Enter 방 채팅·머리 위 말풍선, 한글 입력, 최근 100개 방 내 기록
- 가장자리 낙사·안전 복귀, 트램펄린, F 친구 들기·내려놓기와 Space 탈출
- 공용 YouTube 링크 신청·대기열, 방장 재생 관리, 개인별 듣기·음량
- 닉네임·캐릭터 색상, 혼자 둘러보기
- 6자리 방 코드와 초대 링크, 최대 16명, 참가·퇴장·재접속
- 방장이 이동을 검증하고 상태를 전파하는 P2P 구조
- Discord OAuth2 `identify` 권한으로 프로필 사진 연결 (자격증명 설정 필요)

## 실행

Node.js 24 LTS 권장. Windows PowerShell에서는 `npm.cmd`를 사용합니다.

```powershell
cd web
npm.cmd ci
npm.cmd run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mean_cobalt_man.sql
npm.cmd run dev -- --port 5173 --hostname 127.0.0.1
```

초기 SQL 적용은 새 로컬 DB에서 한 번만 실행합니다. 이 작업 폴더의 로컬 DB에는 이미 적용했습니다. 개발 주소는 `http://127.0.0.1:5173/`입니다. 빌드 결과는 `npm.cmd start`로 확인할 수 있습니다.

## 검증

```powershell
cd web
npm.cmd test
npm.cmd run typecheck
npm.cmd run test:render
# 위의 로컬 서버를 실행한 상태에서:
npm.cmd run test:network
```

- `test`: SQLite에서 실제 로비 API를 실행해 동시 입장 정원, 권한, 방 종료, 인증, 이동을 검사합니다.
- `test:network`: 별도의 세션 16개와 실제 루프백 ICE/DTLS/SCTP 연결을 사용합니다. Node의 WebRTC 구현을 사용하므로 브라우저 호환성·서로 다른 인터넷 환경의 NAT 통과 검사를 대신하지 않습니다.
- `test:render`: 게임의 Canvas 코드를 직접 실행해 `web/outputs/camp-desktop.png`, `camp-mobile.png`를 생성합니다. 전체 웹 UI의 브라우저 캡처는 아닙니다.
- 확장 렌더 장면은 `web/outputs/camp-actions.png`, `camp-actions-mobile.png`, `camp-actions-reduced.png`입니다.

## 구성과 운영

- 앱 소스와 실행 환경: [`web/`](web/)
- 확정된 요구와 구조: [`docs/plan.md`](docs/plan.md)
- 검증 결과와 남은 확인 항목: [`docs/validation.md`](docs/validation.md)
- 배포·Discord·TURN 설정: [`web/README.md`](web/README.md)
- 프로젝트 하네스 규칙: [`AGENTS.md`](AGENTS.md)

첫 버전에서는 방장 퇴장 시 방을 종료합니다. 브라우저가 방장 탭을 정지·절전 처리하면 동기화도 정지할 수 있습니다. 방장 응답이 90초 동안 없으면 로비를 종료합니다. 상시 방 유지·방장 승계·영구 저장은 포함하지 않습니다.

## 새 동작과 함께 듣기

WASD/방향키 이동, E 앉기, Shift를 누르는 동안 웅크리기, Q 감정표현 열기와 1~6 선택, F 가장 가까운 친구 들기·내려놓기, Space 들린 상태에서 탈출, Enter 채팅, Esc 채팅에서 캠프장으로 복귀합니다. 친구에게 들리는 것을 원하지 않으면 동작 버튼 아래 체크를 해제합니다. 떨어지면 약 2초 후 모닥불 근처로 돌아옵니다.

신청곡은 YouTube 영상 링크로 등록합니다. 전원 신청할 수 있으며 대기열은 전체 30곡·인당 3곡입니다. 방장이 전체 재생·일시정지·다음 곡·대기곡 삭제를 관리합니다. 참가자는 함께 듣기와 음악 음량을 각자 선택합니다. 검색·음성 채팅·던지기는 포함하지 않습니다.

공식 YouTube 플레이어를 화면에 표시하며, 절반 이상 보이는 활성 탭에서만 재생합니다. 자동재생이 차단되면 재생 허용 버튼을 누릅니다. 광고·버퍼링·지역/연령/외부 재생 제한 때문에 완전히 같은 시점의 재생을 보장하지 않습니다. 오류는 각자 표시하고 방장이 필요하면 다음 곡으로 넘깁니다. 신청곡·채팅은 방장 메모리에만 남으며 방 종료 시 사라집니다. 이전 버전 참가자는 모두 새로고침해야 합니다.
