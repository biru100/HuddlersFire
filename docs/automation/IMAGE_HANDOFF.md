# ChatGPT 이미지 → GitHub → Work 인계

2026-11-08: 사용자 결정은 **기존 ChatGPT 이미지 생성 사용, 추가 유료 API 사용 없음**이다.

## 실제로 자동화되는 부분과 남는 경계

- ChatGPT Chat에서 기존 이미지 생성 기능으로 원화를 제작한다. OpenAI 이미지 API, 별도 결제·API 키·이미지 외부 서비스는 사용하지 않는다.
- 이미지 생성이 끝나도 실제 원본 PNG가 GitHub에 **자동으로** 생기는 것은 아니다. 같은 Chat에서 다음 요청으로 원본을 GitHub에 등록하거나, GitHub 웹에서 원본 파일을 한 번 업로드한다.
- GitHub에 실제 파일이 생기면 CI가 PNG 바이트·CRC·RGBA8·디코딩·SHA256·요청 메타데이터·승인 f1·캔버스·프레임 순서를 검사하고 수신 결과 artifact를 만든다.
- Work는 PR의 새 커밋/CI 결과를 읽어 기술 작업을 이어갈 수 있다. GitHub PR 이벤트 기반 Work 작업은 사용자가 Work의 트리거·권한 UI를 한 번 확인하고 설정해야 한다. 별도의 Work 채팅이나 이벤트 작업을 이미 만들었다고 주장하지 않는다.
- 기존 매시간 GitHub 점검 작업은 보조 경로다. 생성된 PNG가 GitHub에 올라오지 않았으면 아무것도 받은 것으로 간주하지 않는다.

## 가장 적은 왕복으로 전달하는 방법

1. Chat 이미지 생성 대화에서 정확한 승인 f1 PNG를 참조해 **f2 한 프레임**만 만든다. 실패했다면 실패 원본으로 기록하고 강제 축소/크롭/보정하지 않는다.
2. 이미지 생성 후 같은 Chat 대화에서 이렇게 요청한다.

    이 이미지 원본을 HuddlersFire의 PR #7 f2 후보로 GitHub에 등록해줘. docs/automation/IMAGE_HANDOFF.md 규칙대로 원본 바이트와 SHA256을 검증하고, 실제 생성 메시지의 출처를 request.json에 기록해. 기존 원본을 덮어쓰지 않고 새 attempt로 PR을 만들어줘. 미술 승인은 pending 유지해.

3. Chat이 실제 이미지 바이너리에 접근할 수 있다면 GitHub 연결로 바로 원본을 업로드하고 커밋/PR을 만든다. 접근할 수 없다면 사용자가 GitHub의 해당 작업 브랜치에 원본을 **한 번만 업로드**한다. Work가 request.json을 보완할 수 있지만 실제 생성 출처를 추측하지 않는다.
4. GitHub Actions에서 수신 검사를 실행하고 결과를 아티팩트로 만든다. CI가 막히면 오류를 보고하고 원본을 그대로 보존한다.
5. 기술적으로 적절한 원본이 확보되고 플랜 검토가 존재할 때만 Work가 기존 idle-frames.mjs intake, compose, inspect, assemble 흐름을 진행한다. 이 단계에서도 미술 최종 승인이나 runtime 교체는 별개다.

## 파일 경로 계약

반드시 실제 target job이 존재하는 **동일 브랜치**를 사용한다. Rounded02 NW plan03 job은 현재 main이 아니라 PR #7 art 브랜치에 있다.

    art/sprites/incoming/<set-id>/<frame>/<attempt>/
      original.png
      request.json

예시:

    art/sprites/incoming/rounded02-idle-frames-nw-03/f2/attempt-001/original.png
    art/sprites/incoming/rounded02-idle-frames-nw-03/f2/attempt-001/request.json

시도마다 새 attempt 경로를 만들고 원본을 덮어쓰지 않는다. 공개 저장소이므로 비공개·타인 소유 자료, 토큰, 개인정보를 올리지 않는다.

request.json 예시는 다음과 같다.

    {
      "version": 1,
      "kind": "chatgpt-image-handoff",
      "setId": "rounded02-idle-frames-nw-03",
      "frame": "f2",
      "intent": "inhale",
      "anchorSha256": "c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a",
      "sourceReference": "실제 이미지 생성 메시지 링크 또는 확인된 대화 식별자",
      "sourceModel": "unverified",
      "sourceSha256": null
    }

sourceSha256가 이미 확인되었으면 정확한 64자 해시를 넣고, 아니면 null로 두고 CI가 계산한다. sourceReference는 **실제** 출처만 사용한다. 생성 모델 이름을 검증할 수 없으면 unverified로 유지한다.

## CI 결과 해석

검사 명령은 node tools/art-handoff.mjs inspect 이다. 보고서는 GitHub Actions의 huddlers-handoff-<run> artifact에 art-handoff-report.json으로 들어간다.

- blocked: 규격·출처·해시·바이트 또는 프레임 순서 문제. 해당 PR CI 실패. 잘못된 파일은 자동 변환하지 않는다.
- awaiting_plan_confirmation: PNG의 기초 검사가 통과했지만 실제 ChatGPT 플랜 확인이 필요하다. **미술 승인 아님.**
- ready_for_explicit_intake: 기존 job에 실제 플랜 확인이 있고 기존 무손실 intake 명령을 시도할 수 있다. 이후 영역·이음새·모션/루프 검사는 여전히 필수다.

이는 실제 PNG 전체의 미술적 합격을 뜻하지 않는다. 최초 성공한 frame 하나가 전체 Idle 애니메이션의 완성은 아니다.

## Work PR 이벤트 연결 (사용자 계정에서 최초 한번)

ChatGPT 웹/모바일에서 Work를 열고 GitHub 연결과 biru100/HuddlersFire 접근 권한을 확인한다. 다음 요청으로 GitHub PR 이벤트 작업을 만든다.

    biru100/HuddlersFire의 새 PR 또는 PR 커밋 업데이트가 생기면,
    docs/automation/AGENT_HANDOFF.md와 IMAGE_HANDOFF.md를 읽고,
    해당 PR의 원본 PNG, 수신 artifact, 현재 head CI와 작업 큐를 점검해줘.
    승인된 범위의 무손실 수신·기술 검사·보고는 이어서 수행하되,
    미술 사용자 승인, DB migration, 유료 API, 기존 사이트 삭제는 진행하지 마.
    필요한 사용자 판단 또는 계정 연결 오류가 있을 때만 알려줘.

Work에 표시되는 Trigger·Condition·Prompt와 필요한 권한 승인을 검토한다. 지원되는 GitHub 이벤트 종류는 계정과 연결 상태에 따라 다를 수 있다. 이 Chat 세션에서 Work의 트리거 설정을 대신 완료했다고 주장하지 않는다.

공식 절차: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex

## 운영 배포는 별도

이 그래픽 수신 절차는 site runtime 변경을 자동 승인하지 않는다. 승인된 사이트 코드의 main 배포 검사는 기존 자동 workflow가 담당하고, Cloudflare production 연결값 부족은 GitHub Issue #9에 유지한다. 이미지 생성 API 무료 호출로 가장하거나, 운영 DB를 임의 초기화하지 않는다.
