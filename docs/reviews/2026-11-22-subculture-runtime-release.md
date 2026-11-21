# 서브컬처 도트 캠퍼의 게임 적용

사용자는 네 방향과 동작 후보를 검토한 뒤 “그래 일단 전체 적용 후 배포해줘”라고 요청했다. 승인 범위는 공통 얼굴·교체형 헤어, 두 의상과 전체 동작 아틀라스를 로비와 필드에 연결하고 기존 HuddlersFire Sites에 게시하는 것이다. [사용자 선택과 원본](../../art/sprites/field-camper-v2/subculture-20261122/manifest.json) · [아틀라스 해시](../../art/sprites/field-camper-v2/subculture-20261122/release.json)

| 승인된 런타임 파일 | SHA-256 |
| --- | --- |
| `field-camper-v2-parts.c94358ad19ab.webp` | `c94358ad19abcc7edf010240b309969a8c6b68e2e3ef8660c59dab79b89fa382` |
| `field-camper-walk-parts.9104fd145a07.webp` | `9104fd145a07333ed4aa26eb8750e5452008b6006e7952e9df62acc8bca801ac` |

디코딩한 아틀라스에서 몸통·목·발 192개와 공통 머리 32개를 검사했다. 배포 빌드의 격리 Chromium에서 PC·모바일·125% 화면의 네 착용 조합과 WebGL 75%·100%·300% 보행, Canvas 폴백을 확인했다. `npm test` 373개, 타입 검사, 장면 렌더와 앱 빌드를 통과했다.
