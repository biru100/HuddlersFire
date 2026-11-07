# ChatGPT 디자인 참고 자료 · 원본 보존

사용자가 전달한 `huddlers_lookdev_handoff_v2.zip`과 압축 내부 5개 파일을 변환 없이 보존했다. ZIP SHA256: `a80bbdae68f19ce6ece5fc3b894985a7cc3f1aecac8f0ba8d56a0fa11cd3bf0e`.

- `archive/`: 전달된 ZIP 원본.
- `original/`: 압축 항목의 원래 이름·바이트를 보존한 사본. `MANIFEST.json`, `README_KO.txt`도 수정하지 않았다.
- `technical-intake.json`: Codex의 실제 PNG 디코딩·크기·알파·SHA256 검사. 미술 평가·선택·모델 확인 증거가 아니다.
- `.gitattributes`: 원본 텍스트 항목도 Git 줄바꿈 변환을 하지 않도록 지정한다.

## 수신한 것과 아직 없는 것

| 항목 | 분류 | 상태 |
| --- | --- | --- |
| Rounded 01 NW, 1086×1448 | 과거 착의 시안 | 미승인. Rounded 02로 재지정하지 않음 |
| Rounded 02 A/B 보드 1, 1536×1024 | 디자인 참고판 | 독립 원화가 아님 |
| Rounded 02 A/B 보드 2, 1536×1024 | 디자인 참고판 | 그림 속 64×96 표시는 실제 네이티브 규격의 증거가 아님 |
| Rounded 02 NW 독립 PNG | 신규 제작 대기 | 없음 |
| Rounded 02 SE 독립 PNG | 신규 제작 대기 | 없음 |

이미지 3장의 SHA256·바이트 수·크기는 ZIP manifest와 모두 일치한다. 모두 반투명 픽셀이 있으며 네이티브 alpha 0/255 납품이 아니다. Codex는 이미지의 미술 품질·NW/SE 시점을 판정하거나 승인하지 않았다. 실제 생성 모델 정보는 `null/unverified`다.

이 폴더는 catalog·런타임 manifest·제작 job의 `source/candidate.png`에 연결하지 않는다. 보드 잘라내기, 자동 반전, 강제 축소·양자화로 독립 원화를 만들지 않는다. 새 요청/전달 절차는 [Rounded 02 작업 환경](../../../../docs/briefs/rounded-02/README.md)을 따른다.
