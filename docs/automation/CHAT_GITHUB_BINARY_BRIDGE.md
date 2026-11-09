# Chat → GitHub: 원본 이미지 바이너리 전송 브리지

## 목적과 현재 검증 상태 (2026-11-09)

사용자 요구는 **Chat 이미지 생성 → Chat에서 원본 PNG GitHub 업로드 → 기존 Work PR 자동화로 게임 적용 → 기존 GPT Sites에서 검토 및 게시**이다.

2026-11-09에 Chat의 생성 PNG **485,070 bytes**를 변경 없이 GitHub에 등록하는 테스트가 실제로 성공했다.

- 테스트 PR: https://github.com/biru100/HuddlersFire/pull/17 (검토용 draft)
- 입력 원본 SHA256: \`918d0f2dc2c6fed827c52d346307bd2a9eb12a2d844e2bc06f6a0b4dc4e08a5f\`
- 예상·실제 Git Blob SHA1: \`285d5d6f4d84b964b5348fefefae0c218e653367\` (동일)
- GitHub 원격 파일은 실제 PNG 485,070 bytes, Base64 길이 646,760자로 재조회됨.
- 현재 GitHub Actions: https://github.com/biru100/HuddlersFire/actions/runs/42558140028 (2026-11-09 PR 검증 success).
- 이미지 원본은 **이전 실패한 F2 초안**이다. 원화 품질이나 CORE03 규격 승인 사례가 아니라 **전송 성공** 증거이며, \`reference-only\`로만 사용한다.
- 확인한 크기에서 성공한 것이지, 모든 파일 크기·모든 Chat 실행 환경에서 무조건 성공한다는 보장은 아니다.

## Chat에서의 전송 경로

현재 GitHub 도구는 Base64 본문을 받는 \`create_blob(encoding:"base64")\`를 제공하지만, Chat 이미지 생성 결과의 \`file_id\` / \`sediment://\` 포인터를 그 도구의 본문으로 곧바로 넘기지는 못한다. 그래서 **ChatGPT 파일 라이브러리의 임시 일반 텍스트**를 바이너리 브리지로 사용한다.

1. Chat에서 이미지 생성. 결과로부터 **실제 원본 PNG 파일 바이트**를 확보한다. 다른 시안이나 미리보기로 대체하지 않는다. 사용자의 고정된 원본은 재저장하지 않는다.
2. 로컬 실행 환경에서 원본 \`SHA256\`, 크기, \`Git blob SHA1 = SHA1("blob " + byte_length + NUL + original_bytes)\`를 계산한다.
3. 원본 바이트를 Base64로 인코딩하고 **1024문자 단위의 줄**로 나눠 임시 \`.txt\` 파일로 기록한다. 이 텍스트화는 PNG 자체를 다시 압축하거나 수정하는 작업이 아니다.
4. \`files.manage_library\`로 사용자 본인의 \`/Temporary\`에 임시 텍스트 파일을 등록하고 정확한 \`file_id\`를 확인한다.
5. 하나의 \`functions.exec\` 호출에서 \`files.read\`를 **bounded windows**로 반복한다. 시험에서는 줄 32개씩, 한 호출당 읽기 item 5개씩 총 632줄을 순서대로 가져와 빈칸/줄바꿈만 제거해 원본 Base64 646,760자를 복원했다. 도구별 읽기 길이/호출 한도에 따라 배치 크기를 조정한다. 누락되거나 반환 길이가 다르면 중단한다.
6. 읽어온 Base64 문자열을 **그대로** 연결된 GitHub \`create_blob({encoding:"base64"})\`에 전달한다. 반환 Git Blob SHA와 2번에서 계산한 SHA1이 **정확히 동일**해야만 성공이다.
7. 해당 blob SHA를 새 immutable \`art/sprites/incoming/chat-asset-batches/<batch-id>/originals/<asset-id>.png\`에 Git tree/commit으로 연결한다. 역할/용도/원본 SHA256/실제 이미지 출처를 기록한 \`manifest.json\`을 함께 커밋하고 PR을 연다.
8. GitHub 원격 \`fetch_file(encoding:"base64")\`로 **실제 파일 존재/Blob SHA**를 재확인하고, \`tools/chat-asset-batch.mjs inspect\` CI의 CRC, 디코딩, SHA256 결과를 확인한다. 확인 전에는 Work 수신/업로드 완료라 보고하지 않는다.
9. 브리징 성공 후 \`/Temporary\` 텍스트 중간파일과 로컬 중간 텍스트를 **삭제한다**. 원본 PNG와 GitHub의 원본 바이너리/해시는 보존한다.

이 경로는 **기존 Chat 이미지 생성 기능 + 기존 Files + 연결된 GitHub만 사용**한다. 이미지 생성 API, 유료 외부 호스팅, 별도 사이트, 추가 데이터베이스가 필요 없다.

## Work 및 Sites 인계

기존 \`HuddlersFire PR 후속 작업\` 이벤트형 자동화는 \`pull_request opened/synchronize\`를 감시한다. 새 이미지 PR을 받으면 **실제 PNG + SHA256 + 현재 head CI + manifest**를 기준으로 Work 처리 여부를 결정한다. 원본이 \`reference-only\`이면 게임에 자동 적용할 수 없다. 실제 승인된 작품이면 Work가 파생 픽셀/프레임 분리/엔진 적용/화면 검증을 처리하며 원본 보존과 출력 변경을 분리 기록한다.

Sites 운영 대상은 기존 \`appgprj_6ae8e9ae42708191b253341387aa287f\`, URL \`https://huddlers-fire-camp.gywkd77.chatgpt.site/\`뿐이다. Sites 버전 저장은 게시가 아니다. 미술·게임 적용·DB/Discord 호환성 및 사용자 게시 승인 검토 전 자동 공개 배포하지 않는다.

**현재 자동화의 이벤트형 \`run_now\`는 이 채팅에서 실행할 수 없다.** GitHub 이벤트 발생과 Work 실제 완료를 구분하고, 실행 내역으로만 인계 완료를 주장한다.

## 실패 시 규칙

- Base64 단편 누락, 원본/Blob 해시 불일치, 원격 PNG 없음, CI 실패, 허용량 초과이면 **실패로 기록**한다. 해상도·알파·색상을 변환하거나 임의 대체 파일을 쓰지 않는다.
- \`file_id\`/내부 URL을 공개 저장소에 업로드하지 않고, 공개 승인된 원본의 SHA와 추적 가능한 제작 출처만 기재한다.
- 출력 모델 버전은 API/제품 UI 등에서 검증 가능할 때만 기록하고, 검증 불가하면 \`unverified\`를 사용한다.
- 이 브리지는 일반 컨셉 시트와 여러 리소스에도 사용할 수 있지만, **CORE03의 특정 승인 F1 기반 최종 프레임 규칙**을 자동 완화하지 않는다.
- 이미지가 비공개이거나 타인의 IP/NDA 대상이면 공개 저장소에 올리지 않는다.
