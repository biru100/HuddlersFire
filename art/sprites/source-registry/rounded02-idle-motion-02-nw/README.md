# Rounded 02 Idle v2 · NW 단독 원본

사용자 첨부 Image #1을 새 NW Idle v2 후보로 보존했다. **SE v2는 미수신**이며 기존 SE v1을 대신 등록하지 않는다. 미술·사용자 모션 선택은 `pending-motion-review`, 네이티브/게임 검증도 미완료다.

- [원본 PNG](original/nw-idle-4cut-v2.png): 1254×1254, 915,804 bytes.
- SHA256 `c9779f37594fbaad5dccc25e7cde64d20172cd743d619de3f6ad2144e47e70b0`.
- [Manifest](MANIFEST.json), [체크섬](SHA256SUMS.txt), [기술 비교·루프](../../../../docs/reviews/rounded02-idle-v2-nw-20261108/README.md).
- **NW 원본 업로드·원격 바이트 검증 완료.** 커밋 `8ea406c95aadfd409a1233b216c74fb7dfd088e0`의 PNG를 GitHub raw URL에서 새로 내려받아 SHA256·915,804바이트 일치를 확인했다. [원격 검증 기록](REMOTE_VERIFICATION.json)을 따른다. SE v2 수신이나 모션 승인을 의미하지 않는다.
- version 2 manifest는 **미승인 모션만** 방향별 수신을 허용한다. 기존 version 1 승인 디자인 NW/SE 쌍과 승인 게이트는 바꾸지 않는다.

```powershell
node tools/art-source-registry.mjs verify --manifest art/sprites/source-registry/rounded02-idle-motion-02-nw/MANIFEST.json
```

원본 변환·알파 수정·반전·네이티브 제작·게임 적용·배포는 하지 않았다. 수정본은 새 경로와 새 SHA256으로 받는다.
