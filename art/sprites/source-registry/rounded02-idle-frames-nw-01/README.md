# Rounded 02 NW Idle · anchor 프레임 제작 01

**현재 상태: anchor만 준비됨. f2/f3/f4 미수신, 영역 확인 대기, 모션 승인 대기.**

GitHub commit `9f16c868401991da588b7f4b02eacc71c57d9fa2`의 실제 anchor PNG와 job/플랜/프레임 요청 JSON 등 9개 파일을 다시 다운로드해 로컬 바이트와 SHA256 일치를 검증했다. [원격 검증 증거](REMOTE_VERIFICATION.json)는 anchor와 준비 자료의 업로드만 증명하며 f2/f3/f4 수신·모션 승인은 증명하지 않는다.

- `base/frame01-anchor.png`: 기존 NW 승인 디자인 PNG를 그대로 복사했다. SHA256 `c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a`, 521850 bytes, 1086×1448 RGBA.
- 실제 디자인 부모와 승인 fingerprint는 `job.json`에 연결했다. 디자인 승인은 유지하며 이 그림을 **neutral motion anchor로 쓸지**는 아직 ChatGPT 확인을 받지 않았다.
- `motion-plan/REGION_LOCKS.json`과 `FRAME_INTENT.json`은 초안이다. 실제 ChatGPT 평가나 모션 사용자 선택을 만들지 않았다. `confirmation.json`은 없다.
- `generated/`에 새 원화는 없고 `assembly/`에 시트도 없다. 기존 2×2 후보에서 프레임을 추출하지 않았다.
- [검토 화면](review/loop-preview.html): 실제 anchor·잠금/움직임 오버레이·명암·작은 표시. 재생은 실제 네 프레임 수신 전까지 비활성화된다. GIF 대신 원본 RGBA를 그대로 표시하는 HTML을 사용한다.
- `review/alignment-report.json`은 `awaiting_frames`; `review/art-review.md`는 pending이다. art/native/runtime 승인은 없다.

[새 제작 절차와 CLI](../../../../docs/briefs/rounded-02/idle-frame-workflow.md)를 따른다. ChatGPT에 먼저 **anchor PNG + REGION_LOCKS.md/json + FRAME_INTENT.json + 오버레이**를 전달해 neutral/영역/예산/타이밍 확인을 받는다. 그 후 `motion-plan/f2-request.txt/json`, f3, f4로 하나씩 생성한다. 각 요청에 같은 f1과 플랜을 실제 첨부한다.

미술 생성·평가는 ChatGPT, 원본 보존/기술 검사/무손실 조립은 Codex, 모션 최종 선택은 사용자다. `artApproved:false`, `animationApproved:false`, `decision:pending`, `productionReady:false`, `runtimeVerified:false`를 유지한다. native 변환/게임 자산 교체/배포는 범위 밖이다.
