# 구현 검증 기록

## 2026-11-07 INT-24 · 첫 착의 NW 제작 준비와 미실행 검증 보완

PR #1이 이미 병합됐고 시작 main/기존 작업 브랜치 HEAD는 모두 `2deddaf`임을 확인했다. 기존 작업 브랜치에서 외부 원본의 배타적 수신·SHA256 추적, 요청 변형의 차이, 검토 HTML의 원본/작은 표시/출처·차단 안내, 실제 PNG 검사 통합과 프로젝트 로컬 스킬을 보강했다. 첫 rounded 요청서와 compact/graphic 비교용 job은 준비됐으며 새 캐릭터 원본은 없다.

전체 **291/291**, 파이프라인 **68/68**, 독립 아트 **31/31**, PNG 수신 통합 **4/4** 통과. typecheck/build/Canvas render/로컬 16명 WebRTC 회귀 통과(HTTP 1,537회). 검토 HTML의 일회성 headless 데스크톱/모바일 검사는 샌드박스 `Runtime.enable` 시간 초과 후 일반 실행 권한에서 통과했다. lint는 오류 없이 기존 런타임 경고 4개다. 실제 게임 WebGL·전체 UI·실기기·새 캐릭터 미술/장면 검토·배포는 수행하지 않았다. [수정 파일·실패 원인·검증 범위](reviews/2026-11-07-first-lookdev-validation.md), [최종 요청문과 원본 전달 방법](briefs/nw-clothed-lookdev-01.md)을 따른다.

## 2026-11-07 INT-24 후속 · 일반 ChatGPT 전달 요청서

사용자가 일반 ChatGPT에 넘길 요청서 제작과 제작 전 규격/원본 품질 보존 피드백의 하네스 반영을 명시했다. 기존 `pixelAssetRequest`의 활성 요청을 코드·저장소 설명 없는 NW idle 한 컷용 자연어로 정리했다. canvas/feet/head는 scene-spec에서 가져오며, 원본 참고·6색 제한 폐기·사후 강제 축소 금지·출력 도구 미지원/미측정 항목의 정직한 보고·대표 한 컷 품질 검토를 요구한다. 이후 전체 방향/레이어 명세는 scene-spec에 유지한다.

기존 pixel build가 `REQUEST_MISSING_ASSETS.md`와 복사용 `CHATGPT_REQUEST.txt`, 바이트 보존 `REFERENCE.png`를 함께 출력한다. 사용자 전달 ZIP은 요청문/원본 두 파일만 포함하며 원본 SHA-256 `8931d47d6b8297c4cf74af0d5d44e559dad4bb7cf36a005d822f1e0ae1ed7673`과 일치한다. 문서/프로젝트 로컬 camp-sprite-assets 스킬에 사용자 피드백을 명시하고 모든 후속 픽셀 캐릭터·의상·환경물의 제작 전 규격과 시각 품질 기준으로 연결했다. 전역 설정은 수정하지 않았다.

검증: prepare/build 통과, `npm.cmd run test:sprites:pipeline` **33/33 통과**. 복사 영역에 프로젝트 경로가 없고 규격/앵커가 현재 spec과 일치하며 첨부가 기각 가공본이 아닌 원본과 바이트 동일함을 검사했다. ZIP 구성은 REQUEST.txt와 REFERENCE.png 두 파일이다. 이미지 생성/실제 ChatGPT 전송/게임·브라우저·전체 빌드/공개 배포는 이번에 실행하지 않았다. 생성 결과 품질은 아직 검토 대상이 없다.

## 2026-11-07 INT-24 후속 · 가공 품질 피드백 반영

사용자가 원본보다 거칠고 지저분해졌다고 지적한 64×96·6색 가공본을 기각했다. catalog에서 `needs_redraw`, `review.rejected=true`로 기록하고 pilot 지정과 scene-spec의 기본 참조를 제거했다. 원본 PNG를 형태·색감 참조로 지정하고, 후속 요청은 처음부터 목표 캔버스/픽셀 격자/앵커에 맞춰 그린 NW idle 한 컷부터 검토하도록 수정했다. 6색 제한과 가공본/4배본 첨부 안내, NE/SW/SE 우선 확대 안내를 철회했다. 이미지 바이트는 원본·실험 이력 모두 보존하며 새 생성/추가 변환은 실행하지 않았다.

검증: 기존 `--pixel` prepare/build 통과(70개, 사용 가능 0/보정 23/재생성 41/참고 6). 현재 manifest에서 기본 body pilot은 없으며, 기각 항목에 이전 pilot 플래그가 다시 붙어도 시험 선택에서 제외하는 회귀를 추가했다. `npm.cmd run test:sprites:pipeline` **33/33 통과**. 요청서가 원본을 참조하고 기각 PNG를 첨부로 제시하지 않는 것도 검사했다. 전체 게임/브라우저/빌드는 이번에 재실행하지 않았다. 런타임·공개 자산 변경이 없어 공개 버전 40은 재배포하지 않았다.

아래 정규화 기록의 수치와 당시 화면은 기술 실험의 이력이다. 당시 다음 제작 기준으로 제시한 안내는 이번 사용자 피드백으로 대체됐다. 새 미술 품질 승인은 아직 없다.

## 2026-11-07 INT-24 후속 · NW idle 정규화

사용자가 단일 신체의 64×96 검수본 제작을 승인했다. 원본을 `incoming/body-nw-idle-v1/source.png`로 바이트 보존하고 기존 `rebuild-sprites.mjs --normalize <recipe>` 분기에 결정적 처리와 고정 sprite-gen 배율 1 기하 검사를 통합했다. 생성 모델은 호출하지 않았으며 upstream/전역 설정을 고치지 않았다. 픽셀 파이프라인은 원본·recipe·normalizer·출력·보고서 해시를 함께 검사하고 오래된 조합을 거절한다.

결과는 64×96, alpha 0/255, 불투명 1,815픽셀, 6색이다. 원본/최근접 raw/이진화/팔레트 결과와 4배 참조를 보존했다. 발 (32,88), 머리 (32,28)은 이 컷에서 측정한 초안이다. NW idle 이외의 variant를 만들거나 반전하지 않았다. catalog는 초기 69개 + 파생본 1개이며 등급은 사용 가능 0/보정 24/재생성 40/참고 6이다.

실제 Canvas 합성 3개에서 크기·나무 앞뒤·기존 벤치 주변·빛/그림자를 검토했다. 후보는 `validPosition`을 통과한 곳에 서 있으며 기존 캐릭터만 벤치에 앉는다. 피부가 밤에 어두워 보이고 의상/다른 방향/동작이 없어 생산 승인은 보류했다. 새 컷의 WebGL/전체 UI·실시간 동작·새 커스터마이징 동기화는 미검증이다. 기존 사진/온라인/게임 런타임·정식 sprite manifest는 변경하지 않았다.

검사: pipeline 회귀 32개, 전체 255개, typecheck/build/lint 통과(기존 경고 4개). 최근접 샘플·알파/팔레트·원본 보존·클리핑 거절·재현·오래된 정규화 증거 거절·누락 방향/포즈 차단을 검사했다. 고정 도구의 RGBA 동일성 검사도 통과했다. 런타임 변경이 없어 공개 버전 40의 그래픽을 교체하거나 재배포하지 않았다.

근거: [검수 비교](../art/sprites/pixel-quarterview/derived/body-nw-idle-v1/comparison.png), [필드](../art/sprites/pixel-quarterview/derived/body-nw-idle-v1/review/screens/canvas-body-field.png), [나무](../art/sprites/pixel-quarterview/derived/body-nw-idle-v1/review/screens/canvas-body-tree.png), [벤치 주변](../art/sprites/pixel-quarterview/derived/body-nw-idle-v1/review/screens/canvas-body-seats.png), [관찰·한계](../art/sprites/pixel-quarterview/derived/body-nw-idle-v1/review/observations.md). 후속 요청서는 새 기준 컷을 참조하여 NE/SW/SE 정지 컷부터 받도록 갱신했다.

## 2026-11-07 INT-24 · 픽셀 쿼터뷰 제작 하네스 / 공개 버전 40

**하네스 구현과 기존 기능 회귀는 완료, 전체 픽셀 그래픽/4방향 커스터마이징은 미완료**다. 패키지 START_HERE와 docs 명세를 기존 제작·장면·의도/구조 문서와 로컬 스킬에 통합했다. 전역 설정/모델/생성 도구는 변경·설치하지 않았다. 원본 3장·후보 69개는 incoming에 그대로 보존했고 정식 PNG·기존 manifest·물리/규약 v20·DB/로그인/사진/네트워크 필드는 변경하지 않았다.

변경 코드: 기존 `prepare-sprite-job`, `rebuild-sprites`, `review-sprite-job`, `render-scene-preview`, `sprite-preview-plugin` 진입점에 픽셀 분기를 통합했다. `tools/import-pixel-package.mjs`, `tools/lib/pixel-assets.mjs`, `camp-avatar-assembly.mjs`, `camp-pixel.mjs`를 추가하고 renderer/artwork/shadows/sprite/WebGL 경로를 표시 전용으로 확장했다. 규격은 `scene-spec.json.pixelQuarterview`, 파일별 분류는 `pixel-quarterview/catalog.json`이 소유한다. 검수 UI와 회귀 검사는 기존 web/tests에 있다.

| 실행 | 결과/범위 |
| --- | --- |
| 변경 전 `npm.cmd test` | 242/242 통과 |
| 변경 전 render/typecheck/build/lint | 통과. 직접 Canvas 화면 3장을 `outputs/pixel-quarterview/baseline/`에 저장. 린트 기존 경고 4개 |
| `prepare-sprite-job --pixel`, `rebuild-sprites --job` | 69개 파일/명세 크기/이진 알파 검사 통과. 원본 반투명/RGB 가장자리·색 수와 후보별 방향/접점/프레임 미검증을 보고 |
| 후보 심사 | 사용 가능 0 / 기준점 보정 23 / 재생성 40 / 참고 6. 정확한 파일별 이유는 catalog와 `validation/inventory.json` |
| 변경 후 `npm.cmd test` | 최종 **252/252 통과**. 원본 변경·경로 이탈·초안 저장/불량 ID·레이어 타이밍/캔버스/앵커/crop/팔레트 거절·플래그/프로젝션·무손실 수신/덮어쓰기 거절 포함 |
| 변경 후 typecheck/build/lint | 모두 exit 0. 신규 경고 없음, 기존 경고 4개 유지. 명시적 캐시 크기를 지켜 비교 캡처의 기존 자산이 빠지지 않는 회귀도 추가 |
| `npm.cmd run test:render`와 `render-scene-preview --job` | 통과. 정식 Canvas 전경 및 후보/기존·착석·나무 앞뒤 4장. WebGL 품질 증거와 구분 |
| `test:browser:pixel` | 최종 통과. 격리 Chrome 두 프로필의 실제 RTC/기존 사진·초안 복원·이동/기존 벤치·포탈 왕복·채팅/상태·라디오·nearest 텍스처·Canvas 폴백. 모바일 검수 UI 가로 넘침 없음 |
| 확대/DPR | 페이지 배율 100/125/150%와 DPR 1, 100%/DPR 2 캡처. 페이지 배율 에뮬레이션이며 데스크톱 브라우저 자체 확대/실물 기기는 미검증 |
| 생산 승인 게이트 | `review-sprite-job --job ... --review review.template.json`이 **의도대로 exit 1**: `Unresolved pixel review; production installation blocked`. 자동/시각/생산 승인을 혼동하지 않음 |

검사 중 사실: 최종 이미지 검토에서 픽셀 비교 캡처의 명시적 128개 캐시가 기본값 32개로 덮이는 결함을 발견해 수정했다. 전체 자산 유지 회귀를 추가하고 Canvas 4장과 브라우저 13개를 새 해시로 다시 생성·검토했다. 초기 빈 배경 캡처는 최종 증거에서 제외했다. 샌드박스 Chrome는 `Runtime.enable`에 응답하지 않아 테스트 프로세스만 제한 밖에서 실행했다. 개인 브라우저는 사용하지 않았다. 병렬 검사 한 번에서 기존 appearance PNG 동등성 검사가 6/5로 실패했으며, 기대값 변경 없이 단독 재실행과 최종 전체 재실행은 통과했다. 원인은 확정하지 않았다. 기본 화면 비교에서 고정 시각 expanded-camp와 모바일은 픽셀 차이 0, 시각을 고정하지 않는 16인 기존 fixture는 24픽셀 차이가 났다. 이를 전체 화면의 완전 동일성 증거로 보고하지 않는다.

실제 확인한 화면: [변경 전 표현](../art/sprites/pixel-quarterview/validation/screens/canvas-before.png), [후보 소품 합성](../art/sprites/pixel-quarterview/validation/screens/canvas-candidates.png), [나무 앞뒤](../art/sprites/pixel-quarterview/validation/screens/canvas-occlusion.png), [기존 벤치 착석](../art/sprites/pixel-quarterview/validation/screens/ui-seated.png), [커스터마이징 검수](../art/sprites/pixel-quarterview/validation/screens/ui-avatar.png), [모바일 검수](../art/sprites/pixel-quarterview/validation/screens/ui-avatar-mobile.png), [Canvas 폴백](../art/sprites/pixel-quarterview/validation/screens/ui-canvas-fallback.png). `validation/evidence.json`과 `result.json`은 Canvas 4/UI 13개 캡처의 경로·해시·검사 범위를 기록한다. 캡처 생성만으로 미술 품질을 통과 처리하지 않았다.

시각 관찰/미해결: 나무·랜턴·라디오의 시험 접점은 연결됐으나 주변 구아슈와 픽셀 밀도/크기 차이가 보인다. 캐릭터·벤치·불은 새 방향/동작/분리 자료가 없어 기존 표현을 유지한다. 4방향 조립 가능 조합은 0개이며 원본 부위는 겹치지 않고 참고 카드로 표시한다. 색상 ID는 초안 저장만 한다. 개인 사진·공유 상태는 유지하지만 새 커스터마이징의 온라인 저장/전송은 구현하지 않았다. 신규 픽셀 불/노멀·전체 맵·실물 모바일·실제 YouTube/Discord·인터넷 NAT는 미검증이다. [추가 제작 요청](REQUEST_MISSING_ASSETS.md)과 [제품 검토](product-review.md)를 따른다.

사용자 “끝나고 배포, 커밋, 푸시해줘” 요청에 따라 기존 Sites에 **버전 40·규약 v20**을 배포했다. 게시 소스 `c4ea90547f9feb82358f12b624ea7c76ea1828c9`, 빌드 `6cd35d15-c98f-4b9b-b0e9-e0262bf01c98` / revision `1793997969500`. [공개 사이트](https://huddlers-fire-camp.gywkd77.chatgpt.site)의 파일 **103개 전부 해시 일치**, 메인/API 200, 검수 경로 404를 확인했다. 기존 public 접근·DB 바인딩·환경 revision 1을 유지했다. 미승인 원본/후보·개발 검수 페이지는 생산 빌드에 포함하지 않았다. Git 게시 저장소의 계정 차이는 해당 프로세스의 정확한 safe.directory 값으로만 처리했고 전역 설정을 바꾸지 않았다. 상세 공개 검증은 `art/sprites/pixel-quarterview/validation/publication.json`에 있다.

롤백: 개발 query의 `pixel=1`을 지우면 원래 그래픽으로 즉시 돌아온다. `CAMP_PREVIEW_JOB`을 해제하고 개발 서버를 재시작하면 미리보기 주입/검수 경로도 사라진다. 소스 전체는 이번 커밋을 revert해 복원할 수 있다. 공개 복원은 복원한 소스로 **새 빌드**를 만들어 배포하여 기존 업데이트 fence를 유지한다. 과거 바이너리로 revision을 되돌리지 않는다. 현재 생산 기본값은 이미 기존 그래픽이다.

## 2026-11-07 · 픽셀 실험 종료와 공개 버전 38 복원

사용자 요청으로 로컬 코드·자산을 현재 공개 버전 **38·규약 v20**으로 복원했다. Sites의 버전·배포 성공 상태와 게시 소스 커밋 `a1b6163f0937520651f9c4d63366b7ce36cd318a`를 확인했다. 게시 과정에서만 추가한 `.gitattributes`를 제외한 소스 **291개**가 배포 기록의 SHA-256과 일치하며 누락·추가 파일은 없다. 검증 빌드 후 로컬 `dist`도 배포 당시 **175개 파일의 원래 바이트**로 복원했다. 그림자 제거 시안도 되돌렸다. 픽셀 제작·미리보기 예외와 관련 문서·도구를 제거하고 기존 공개본의 제작 계약을 복원했다.

- **삭제:** 프로젝트 내부 모델·엔진·캐시·파일럿과 전용 스크립트 2,479개 파일 **7,331,635,668 bytes**, 전용 임시 레퍼런스 6개 파일 **11,529,544 bytes**. 합계 **7,343,165,212 bytes(약 7.34GB / 6.84GiB)**. 비교용 PyTorch 환경은 앞선 작업에서 이미 제거했으며 이번 확보 용량에 중복 합산하지 않는다. 잔여 픽셀 모델·생성 프로세스는 없다. 기존 sprite-gen과 배포본의 원화·제작 환경은 유지했다.
- **검증:** `npm.cmd test` **242/242 PASS**, `npm.cmd run typecheck`, `npm.cmd run test:render` **35개 Canvas 장면**, `npm.cmd run build` PASS. 새로운 시각 품질 승인이나 실제 브라우저 재검토로 해석하지 않는다. 공개 서비스·DB·접근 설정의 변경이나 재배포는 수행하지 않았다.

## INT-22 공개 배포 · 버전 38 / 규약 v20 (2026-11-06)

사용자 후속 **“일단 배포해줘”** 요청으로 검증한 참가자 피드백 개선본을 기존 사이트 https://huddlers-fire-camp.gywkd77.chatgpt.site 에 배포했다. 배포 `appgdep_6aede43021308191b0e053fb73fa916a`는 **succeeded**, 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_d2cbcb6844dc8191b588faac3791cfbb`는 **38**이다. public 접근·DB 바인딩·환경 리비전 **1**을 유지했다. 별도 DB/환경 변경은 없다. 기존 자동 업데이트 기능이 새 release를 감지해 이전 방을 초기화하고 새 로비로 전환한다.

- **게시 전 검증:** 아래 로컬 **242/242 회귀·타입·Canvas 35장·실제 두 브라우저/PIP/오디오 검사·빌드**의 실행 결과를 입력이 변하지 않아 재사용했다. 이번에 현재 코드와 **53개 실제 화면**의 fingerprint `242d045614b6a31aed0bdae79cf273655a1c08ca9ff8b42dd328e2b4bebddde2`를 다시 확인했다. 런타임 입력 **217개**가 검증 빌드보다 새롭지 않다. 기존 종합 보행 하네스 중단은 아래 한계대로 유지하며 전체 PASS로 바꾸지 않았다.
- **소스·패키지:** 게시 시점 소스 **292개**의 원본/게시 작업본/Git blob과 빌드 **175개**의 해시가 일치한다. 게시 전용 저장소 커밋·푸시 `a1b6163f0937520651f9c4d63366b7ce36cd318a`를 사용했고 원본 저장소는 커밋·푸시하지 않았다. 아카이브 `web/outputs/huddlers-fire-feedback-v1-deploy.tar.gz`는 **18,411,173 bytes**, gzip SHA-256 `2a264e214df17e354609761132e45bf15ff315158b3e403a8c2ce8e3d135c764`다. 비밀값·Git·의존성·로컬 상태는 포함하지 않는다. Sites 저장 tar SHA-256은 `eb558d3c208b3b54b9a55b8a8168dad36d626b798ae7f4b9b1402037ea697165`이다. 기존 검토 PNG 27개와 원화는 그대로다.
- **공개 확인:** HTML과 정적 파일 **102개**가 게시 빌드와 일치한다. `/api/camp/version`은 검증한 `4a9952ec-b15e-490f-8797-fde8ea1537c9` / revision `1793974619298`을 반환한다. 방 목록 200·Discord 준비·현재 release의 미인증 방 생성 401을 확인했다. 사용자 방·세션을 검사 목적으로 만들지 않았다. 배포·공개 검사 기록은 `web/outputs/feedback-publish/`에 보존했다. 네트워크가 제한된 기본 실행에서 게시 저장소 연결 실패가 있었고, 허용된 네트워크 실행으로 같은 사이트를 이어 게시했다. 전역 설정은 변경하지 않았다.

실제 휴대전화·NAT·외부 미디어/물리 스피커·커뮤니티 선호의 한계는 아래 로컬 기록과 같다. 공개 API/파일 확인을 이 항목의 실사용 검사로 확대하지 않는다.

## INT-22 참가자 피드백 개선 (2026-11-06, 로컬)

**승인 범위:** 사용자 “계획대로 구현”에 따른 로컬 수정·검증이다. 공개 사이트는 **버전 37·규약 v20**으로 유지하며 배포·커밋·푸시는 하지 않았다. DB·전송 필드·규약 변경도 없다. 빌드는 로컬 식별자 `4a9952ec-b15e-490f-8797-fde8ea1537c9` / revision `1793974619298`이며 공개 활성화를 뜻하지 않는다.

- **수정:** 상태 드롭다운 제거·즉시 상태 버튼/명시적 메모 저장·초안과 최신 상태 병합·500ms 재제출 제한, 머리 위 상태 한마디와 사람 목록 작업 표시, 자유 시점 드래그/포인터 기준 확대·착석/따라가기 줌 유지, UI 다크와 컬러 필드 분리, 라디오 연결선 제거/화면 밖 숨김, 신규 효과음 25%·기존 음소거 보존·실패/재시도/재생 상태를 구현했다. 일반 채팅 연결선·공유 물리·업데이트 전환은 유지한다.
- **회귀/빌드:** 최종 `npm.cmd test` **242/242 PASS**, 실패·건너뜀 0 (`web/outputs/feedback-v1/final-tests.txt`). `typecheck` **PASS**, `test:render` **35장 PASS** (`render.txt`), `sprites:build` 재현 **PASS**, 공식 `npm.cmd run build` **PASS** (`build.txt`). Canvas 직접 렌더와 실제 WebGL/UI 검사를 구분한다. 입력의 클릭/드래그 구분·취소/잠금, 자유 카메라 좌표·휠 기준점, 수동 줌과 높은 연쇄 전체 보기, 상태 배지·라디오 선, 기본 음량과 저장한 0, 오디오 실패/재시도/구독 정리를 검사했다.
- **실제 UI/RTC/오디오:** `browser.feedback.mjs` **PASS**. 별도 Chrome context 두 개가 실제 RTC로 연결되어 상태 즉시 반영·저장 전 메모 비전송·초안 탭 전환 보존·최신 상태로 메모 저장·상대 목록의 한마디/작업 표시·작업 시간 누적/중지를 확인했다. 실제 포인터 드래그 135/-70px가 공유 좌표를 바꾸지 않고 자유 시점으로 전환되며 착석·따라가기 복귀/일어서기에도 선택 줌을 유지했다. 파일 요청을 고의 실패시켜 안내를 확인한 뒤 재시도로 native AudioContext가 running 상태의 비영 출력(절댓값 > 1e-6)을 내는 것을 검사했다. 실제 `.ogg` decode/신호 측정이며 물리 스피커 청취는 아니다. OAuth·Discord 사진·YouTube는 모의 콘텐츠다. 모바일 390×844·Document PIP 560×480도 **PASS**. 원자료는 `web/outputs/feedback-v1/browser-result.json`이다.
- **화면 검토:** `browser.lighting.mjs` 대표 5개 → 전체·`browser.polish.mjs` → `browser.lighting-ui.mjs` → `browser.feedback.mjs` 순으로 캡처했다. WebGL/노멀 draw·조명 진단, 컨텍스트 손실/복구와 Canvas, 1/3/8/16명·모바일, 실제 상태/사람 패널·다크 UI·라디오·오디오·PIP를 포함한 **53개 PNG**를 열어 관찰했다. [검토](../art/sprites/field-polish-v1/release-feedback-v1/review.json)·[증거](../art/sprites/field-polish-v1/release-feedback-v1/evidence.json) fingerprint는 `242d045614b6a31aed0bdae79cf273655a1c08ca9ff8b42dd328e2b4bebddde2`다. 신규 UI 10개와 기존 호환 43개를 구분하며 직접 다크 필드는 자산 제작 호환 검사다. 실제 앱 다크는 컬러 필드를 유지한다. 기술 PASS를 미감 자동 판정으로 사용하지 않았다.
- **자산:** 신규 생성/재패킹 없이 기존 PNG **27/27 동일**, 변경 0 (`asset-comparison.json`). `release-updates-v1`은 보존하고 현재 검토만 `release-feedback-v1`에 설치했다. 기본 재현도 새 검토를 통과했다.
- **추가 종합 검사 중단:** 기존 `browser.community.mjs`도 실행했다. 지연 로딩 중 효과음 조절·최신 값/음소거·E 착석·장작/XP/쿨다운은 PASS했으나 불멍→놀이터 보행 단계에서 `browser-field.mjs`의 좌표 추적 timeout으로 종료됐다 (`community-browser.txt`). 이 보조 추적은 native Canvas ellipse와 예전 고정 카메라 원점을 가정한다. 현재 WebGL 기록 경로는 native ellipse 호출을 계속하지 않으므로 이번에는 종합 시나리오 전체 PASS로 보고하지 않는다. 제품 상태를 읽기만 하는 실제 렌더러 관찰을 사용하는 새 `browser.feedback.mjs`의 두 브라우저 결과와 구분한다. 이 보행 하네스의 갱신은 별도 후속 범위다.

**남은 확인 범위:** 실제 휴대전화 성능/터치·인터넷 NAT·외부 YouTube의 음향/정책·물리 출력 장치·커뮤니티 선호는 이번 로컬 검사로 확인하지 않았다. 고정된 따라가기/자유 배율에서는 먼 친구가 잘릴 수 있어 전체 보기를 별도로 사용한다. 열린 패널/영상은 기존처럼 장면 공간을 차지한다. 승인 범위의 미해결 화면 결함은 없다.

## INT-21 배포 후 방 초기화·자동 새로고침 (2026-11-06)

**공개 완료:** 기존 사이트 https://huddlers-fire-camp.gywkd77.chatgpt.site 의 **버전 37·규약 v20**으로 배포했다. 배포 `appgdep_6aedd1e38344819185fbf939f2d838aa`는 **succeeded**, 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_ee6d6ee0f54c81919bae0e239e48e11c`다. public 접근·DB 바인딩·환경 리비전 **1**을 유지했다. 게시 전용 저장소 커밋은 `cd3947e713a9df925cdd13b1ebbe20d69537abfc`이며 원본 저장소는 커밋·푸시하지 않았다.

게시 시점 소스 **290개**의 원본/작업본/Git blob, 빌드 **175개**의 해시가 일치했다. 런타임 입력 **216개**는 최종 검증 빌드보다 새롭지 않았다. 아카이브 `web/outputs/huddlers-fire-auto-update-v1-deploy.tar.gz`는 **18,407,989 bytes**, gzip SHA-256 `0e9653fe7f44cc4b336a5f896b960542006b882f86546f0e6746dcefa50dddd4`, Sites 저장 tar SHA-256 `77e0c3560b97d35afb368eb274f24dcc61209da4acc8f42b9f4f76f4853752a1`이다. 비밀값·Git·의존성·로컬 상태를 제외했다. 공개 파일 **102개**가 게시 빌드와 일치하고 `/api/camp/version`은 최종 검증한 `ab6a4a02-2999-429a-a177-a57a0dfebfaa` / `1793970377044`를 반환한다. 새 테이블을 사용하는 API 성공으로 마이그레이션 적용도 확인했다. 방 목록 200·Discord 준비·현재 release의 미인증 생성 401을 확인했고 사용자 방·세션은 만들지 않았다. 배포/공개 검사 기록은 `web/outputs/update-publish/`에 보존했다.

사용자 요청에 따라 빌드 UUID/revision, D1 배포 fence, 이전 방의 일회 초기화와 클라이언트 자동 전환을 구현했다. 마이그레이션 `0004_release_reset`은 `camp_runtime`만 추가한다. 새 빌드의 최초 API 활성화가 방·참가·시그널을 한 트랜잭션으로 정리한다. 로그인·Discord 프로필·개인 설정은 보존한다. 같은 빌드/일시 장애·늦은 구 Worker 응답은 새 방 초기화나 뒤로 업데이트를 일으키지 않는다. 로비/솔로는 15초 주기·창 복귀 때 검사하고, 방은 기존 폴링 응답에서도 감지한다.

- **회귀:** 최종 `npm.cmd test` **237/237 PASS**, 실패·건너뜀 0. 추가 7개 검사는 배포 일회 초기화·FK cascade·프로필 보존, 구 클라이언트/구 Worker 거절, 생성 도중 배포 경쟁, 익명/캐시 없는 버전 조회, URL·무한 새로고침 방지, 포커스/정리/장애, API 응답 전 버전 감지와 이전 revision 거절을 확인한다. 타입 검사 **PASS**. 일반 방 폴링은 캐시한 활성화 후 DB fence 조회 한 문장만 추가하며 기존 SQL 상한 회귀도 통과했다.
- **실제 컴파일 앱 전환:** 격리 headless Chrome과 로컬 Worker/SQLite/모의 Discord로 `browser.updates.mjs`를 실행했다. 실제 공개 v36 빌드 → 새 빌드 → 다른 UUID의 다음 빌드를 연속 전환했다. v36의 410 종료·새 로비 로드, 다음 전환의 자동 감지·방/참가 0·PIP 종료·연결 정리·room URL 제거·기타 URL/프로필/개인 설정 보존을 확인했다. 다음 15초 검사 후에도 추가 탐색이 없어 새로고침 반복이 없었다. 로그/원자료는 `web/outputs/scene-polish-publish/update-browser.{txt,json}`, 화면은 `update-before-legacy.png`, `update-after-legacy.png`, `update-after-current.png`다.
- **연결:** 전체 Node WebRTC 루프백 **PASS**, 16명·17번째 거절·놀이·맵·채팅/음악·재연결·승계 epoch 5, HTTP **1510회**. 실제 인터넷/NAT·휴대전화 RTC 결과로 확대하지 않는다. `update-network.txt`에 기록했다.
- **화면/자산:** 색/노멀 PNG 27개는 이전과 같고 새 원화를 만들지 않았다. 새 런타임 지문 `840cd2202c759e696c91bf15c4f70f35738c453c28dc1febdd7684123d930378`으로 43개 장면을 재캡처했다. 29장은 이전 검토 PNG와 바이트가 같고, 차이 있는 불꽃 시점·1/3명·UI 14장은 열어 확인했다. 기존 검토본을 덮지 않고 [새 검토 revision](../art/sprites/field-polish-v1/release-updates-v1/review.json)과 evidence를 보존했다. 도구의 선택적 review revision 인자는 동일 원화에 대한 후속 코드 검토를 분리하며 기본 불변 release 보호는 유지한다.
- **빌드:** 공식 Sites 빌드를 두 번 만들어 서로 다른 UUID/revision과 실제 새 클라이언트 로드를 확인했다. 최종 검증 빌드는 `ab6a4a02-2999-429a-a177-a57a0dfebfaa` / revision `1793970377044`이며 `update-build-next.txt`에 있다. 테스트 도중 구 빌드 서버가 원본 dist를 잡아 발생한 Windows 잠금은 별도 서버 스냅샷으로 격리해 해결했고 실패 산출물은 사용하지 않았다. 최종 빌드/브라우저 검사를 다시 완료했다.

**전환 한계:** 이 기능을 아직 로드하지 않은 이전 로비/솔로 페이지에는 새 코드를 원격 실행할 수 없으므로 처음 한 번 수동 새로고침이 필요하다. 기존 v36 방은 이미 있던 종료 처리로 자동 새로고침되는 것을 확인했다. 이후 빌드는 로비·솔로도 자동 감지한다. 브라우저가 완전히 정지된 탭은 실행이 재개될 때 검사한다. 실물 휴대전화·실제 Discord/YouTube 음향과 공개 인터넷에서 배포 전환을 재현한 결과는 아니다.

## INT-20 장면 구성 개선 공개 배포 · 버전 36 / 규약 v20 (2026-11-06)

사용자 후속 **“배포해줘”** 요청으로 검증한 `field-polish-v1`을 기존 공개 사이트에 반영했다. 아래 로컬 구현 당시의 배포 제외 표기는 이력이며 이번 배포가 해당 경계를 대체한다.

- **공개 결과:** https://huddlers-fire-camp.gywkd77.chatgpt.site · 버전 **36**, 배포 `appgdep_6aedca12916081918007eb2fea084a51`, 최종 **succeeded**. 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_9756e1656b7081919bfd797379e877f7`. 기존 public 접근·DB 바인딩·환경 리비전 **1**을 유지했다. 새 SQL·환경 변경은 없다. 좌석 배치 변경을 구분하는 규약 **v20**이 공개됐으므로 기존 열린 페이지는 함께 새로고침해야 한다.
- **검증:** 현재 코드·자산과 **43개 화면**의 fingerprint `5dfa2f1f27ed8fb57e30adb3d172b84bad0fdd4820862103eb1b591552100414` 일치를 다시 확인했다. 입력이 같은 기존 **230/230 테스트·19/19 파이프라인·Canvas·타입·GPU·루프백 RTC 검사**를 재사용했으며 이번 실행으로 세지 않는다. 공식 `build-site.mjs`로 이번 게시 빌드를 새로 완료했다.
- **게시 소스·패키지:** 런타임 입력 **212개**가 빌드보다 새롭지 않고, 게시 시점 소스 **284개**의 원본/게시 작업본/Git blob과 빌드 **173개**의 해시가 일치했다. 게시 전용 저장소 커밋·푸시 `793d7392eef1dad7ed9bcff4cf3de0107564431a`를 사용했다. 원본 저장소는 커밋·푸시하지 않았다. Git 소유권 확인에는 프로세스 한정 경로 설정을 사용했고 전역 설정을 변경하지 않았다.
- **아카이브:** `web/outputs/huddlers-fire-polish-v1-deploy.tar.gz` **18,405,298 bytes**, gzip SHA-256 `8c31186d4d2ed4fbe9d1f906b6674143770f01fc114d359a4b56aa403757e0c2`. Sites 저장 tar SHA-256 `c78615b7eb1be93de8a18a6db16dab86ae84dd2106f90a150b138f9fa008685c`. 비밀값·Git·의존성·로컬 실행 상태를 포함하지 않는다. 보관된 이전 공개 PNG도 정적 파일에 포함되며 현재 manifest가 참조하는 런타임 자산 예산과 구분한다.
- **공개 확인:** HTML과 JS/CSS·스프라이트·음원·게임 미디어 등 **102개 파일**을 새 빌드와 SHA-256 대조했다. 공개 manifest의 **field-polish-v1·PNG 27개**, 방 목록 HTTP **200**, `discordAvailable:true`, 미인증 방 생성 **401**을 확인했다. 사용자 방·로그인 세션은 만들지 않았다. 기존 사이트 audience는 **public**이며 버전 **36**을 다시 확인했다.

배포·해시·공개 검사 기록은 `web/outputs/scene-polish-publish/{publication,deploy-inputs,deploy-package-check,deployment-check}.json`에 있다. 원본 저장소의 문서 상태는 배포 결과로 갱신하며 게시 스냅샷은 보존한다. 공개 파일/API 검사는 아래 실기기·실인터넷·실제 외부 미디어·커뮤니티 선호의 미확인 범위를 대체하지 않는다.

## INT-20 스프라이트·화면 구성 개선 · field-polish-v1 / 로컬 규약 v20 (2026-11-06)

**승인·범위:** 사용자가 원인 분석에 이은 수정 계획에 **“계획대로 구현”**을 선택했다. 카메라/HUD·좌석군/지형/소품·기본 얼굴/이동·부분 원화와 불꽃 루프를 구현하고 로컬 검증했다. 공개 사이트는 **버전 35·규약 v19**를 유지하며 이번 작업에서 배포·커밋·푸시하지 않았다. 기존 사진 복구·야간 조명 수정은 보존했다. 새 좌석 배치 혼용을 막기 위해 로컬 규약을 v20으로 올렸고 공유 필드·DB 스키마는 유지했다.

**구현:** `camp-camera.mjs`의 기본 따라가기와 전체 보기 분리, HUD/영상 점유 영역 반영, 화면 픽셀 이름표/선택 영역, 비대칭 좌석군·다른 나무/벤치·비정형 공터/길, 몸과 기본 얼굴의 앞뒤·정지 방향 유지, 5종 불꽃의 고정 바닥 6프레임 루프를 적용했다. 사진은 원형/원색/원래 방향을 보존한다. 상단 필드 도구는 두 항목과 `보기` 메뉴로 정리하고 빈 라디오·밤의 불 도구를 축소·감광했다. 나무/텐트 크기에 맞춰 가림과 그림자 마스크도 갱신했다.

### 자산과 재현

- 고정 sprite-gen `4f5ccd` 계열의 프로젝트 lock을 사용했다. 기존 원본 **47개 재사용**, 내장 imagegen으로 **12개 부분 제작**: 뒤 idle/walk/run, 나무 두 종·벤치 두 변형, 5종 불꽃. 전체 명세 **59개**, 캐릭터 **83프레임**, 불꽃 **30프레임**이다. 외부 유료 API 호출은 없었다.
- 원본/실제 생성 지시/참조/해시/alpha 검사/동결 앵커는 [artwork](../art/sprites/field-polish-v1/artwork/job.json)와 [generation-receipts](../art/sprites/field-polish-v1/artwork/generation-receipts.json)에 보존했다. Amber의 첫 얼룩 있는 결과는 `artwork/rejected`에 남기고 내장 편집 결과를 적용했다. 기존 원본의 재사용과 전체 신규 생성을 구분한다.
- 대표 네 소품은 별도 파일럿에서 합성했고, 이후 전체 색상/다크·새 크기의 노멀을 만들었다. 27개 런타임 PNG는 합계 **9,571,297 bytes**로 전체 10MB 예산 안이다. 노멀은 캐릭터 **768×1056**, 환경 **768×1152**다. 프레임 페이지/노멀 크기는 manifest에서 파생한다.
- 현재 [release](../art/sprites/field-polish-v1/release/review.json)와 `material-release.json`에 로컬 설치했다. `npm.cmd run sprites:build` **PASS**: 동결 색상 원본에서 현재 재질 묶음 재현·해시·검토를 확인했다. 기존 원본 해시 변경 거절과 부분 미리보기의 기존 좌석 binding 보존도 회귀로 고정했다.

### 실제 화면 검토

대표 검토 5개 이후 실제 WebGL/Canvas/UI **43개**를 캡처하고 PNG를 열어 관찰했다. [review](../art/sprites/field-polish-v1/release/review.json), [evidence](../art/sprites/field-polish-v1/release/evidence.json)의 fingerprint는 `5dfa2f1f27ed8fb57e30adb3d172b84bad0fdd4820862103eb1b591552100414`다. 자동 정합성 검증은 `verified:true, scope:full, cases:43`이며 시각 판단은 각 case의 별도 관찰로 남겼다.

- [1명](../art/sprites/field-polish-v1/release/screens/polish-solo.png)·[3명](../art/sprites/field-polish-v1/release/screens/polish-three.png)의 기본 따라가기, 8/16명 전체 보기, [390×720 모바일 3명](../art/sprites/field-polish-v1/release/screens/polish-mobile.png), 앞/뒤/좌/우 이동·정지, 5종 불꽃을 확인했다. 네 착석 몸 방향과 좌면 접촉, 이름/머리 가림도 확인했다.
- 기본/약한/강한 불·직접광 없음·노멀 없음·랜턴·좌/우 진단광, 세 맵 컬러/다크, 혼합 행동/16명 높은 연쇄, WebGL 컨텍스트 손실/복구와 강제 Canvas를 각각 확인했다. 원화 5페이지와 노멀 2장, 별도 원본 혼합 자세·불꽃 6프레임 및 루프 이음도 열었다.
- 기본 PC/모바일, 필드, 열린 대화, 영상, 560×480 PIP의 UI **9개**를 확인했다. [모바일 기본](../art/sprites/field-polish-v1/release/screens/ui-mobile-default.png), [모바일 영상](../art/sprites/field-polish-v1/release/screens/ui-mobile-video.png)에서 조작·인물/이름·불을 읽을 수 있다. 영상은 모의 YouTube fixture, 원색 원형은 반전 검사용 모의 사진이다. 실제 개인 계정·브라우저 UI는 조작하지 않았다.

같은 Canvas fixture의 수정 전/후 측정은 `web/outputs/scene-polish/{before,after}/metrics.json`이다. 390×720 솔로의 원형 머리 지름은 **18.1 → 37.7px**, 3명 착석은 **23.2 → 35.4px**다. 솔로 이름 글자는 이전 줌 적용 약 **5.9px → 현재 12.2px**다. 전체 보기의 인물 축소는 의도적으로 유지하며 이름은 최소 12px다. 이 수치는 해당 상태의 표시 크기이며 실기기 성능 수치가 아니다.

### 기술 검사

| 검사 | 이번 실행 결과 |
| --- | --- |
| `npm.cmd test` · 정식 로컬 manifest | **230/230 PASS**, 실패·건너뜀 0 |
| `npm.cmd run test:sprites:pipeline` | **19/19 PASS** |
| `npm.cmd run typecheck`, `npm.cmd run build` | **PASS** · 새 자산 설치 후 최종 빌드 |
| `npm.cmd run test:render` | **PASS** · Canvas 장면/입력/접촉/선택 회귀, WebGL 품질과 구분 |
| `node tests/render-polish.mjs outputs/scene-polish/after` | 정식 manifest로 **7개 Canvas 장면** 출력 |
| `browser.night-lighting.mjs` | 실제 GPU 픽셀 계약 **PASS** |
| `test:network` · 로컬 Node WebRTC | **PASS**, 16명·17번째 거절·놀이/좌석/맵 이동·불 성장·복구/승계 epoch 5, HTTP **1592회** |

GPU의 무광원 `[36,44,60]`, 근접광 `[211,159,100]`, 먼 거리/노멀 없음/확대 불변, 보호 사진·발광 `[192,192,192]`, 투명 alpha 0을 확인했다. 네트워크 검사는 모의 API와 Node WebRTC의 루프백 연결이며 실제 인터넷/NAT·브라우저 간 RTC로 확대하지 않는다. 로그는 `web/outputs/scene-polish/`의 `tests-final.txt`, `pipeline-final.txt`, `typecheck-final.txt`, `build-final.txt`, `render.txt`, `network.txt`, `replay.txt`에 있다.

### 렌더링 비용과 한계

같은 16명 혼합 동작, 120프레임 준비 후 360프레임을 수집했다. 격리 headless Chrome, **RTX 5070 / ANGLE D3D11**이며 이전 버전과 동시 비교하지 않아 성능 개선률은 주장하지 않는다. [원자료](../art/sprites/field-polish-v1/release/browser-metrics.json)는 CPU 제출·rAF 간격·GPU 타이머를 분리한다.

| 화면/경로 | CPU 중앙 / p95 (ms) | GPU 중앙 / p95 (ms) |
| --- | --- | --- |
| 1050×824 DPR1 · WebGL | 2.4 / 4.8 | 0.93 / 3.38 |
| 390×844 DPR2 모의 · WebGL | 2.6 / 4.4 | 1.06 / 3.13 |
| PC · Canvas | 2.2 / 4.3 | 해당 없음 |
| 모바일 화면 모의 · Canvas | 2.4 / 4.5 | 해당 없음 |

WebGL 텍스처 추정은 약 59.2MB로 80MB 상한 안이며 전체 드라이버 메모리 측정은 아니다. Canvas 색 보정 캐시는 약 15.5MB로 16MB 상한 안이다. 실물 휴대전화의 FPS/발열·터치 사용감, 실인터넷 RTC, 실제 Discord/YouTube 콘텐츠와 음향, 커뮤니티 선호는 미확인이다. 높은 연쇄와 전체 보기는 인물이 작아지는 예외이고 열린 대화 패널은 기존처럼 장면을 덮는다. 승인 범위의 화면 결함 검토와 이 검증 한계를 구분한다.

## Discord 프로필 사진 누락 수정 · 공개 버전 35 / 규약 v19 (2026-11-06)

- **원인:** 실제 공개 로그에서 사진 중계 응답 502를 확인했다. 개인정보 없는 잘못된 사진 주소도 공개 중계는 502, Discord 원본은 404였다. 같은 호환 날짜의 workerd에서 `redirect: 'error'`가 즉시 TypeError를 발생시키고 `manual`은 정상 요청하는 것을 재현했다. 추가로 로비 장면 상태와 렌더러의 미리보기 캐릭터에 avatar 전달이 빠져 있었다.
- **수정:** `camp-avatar-proxy.mjs`를 `manual`로 바꾸고 기존 `!response.ok` 검사로 리다이렉트 거절을 유지했다. `app/camp.tsx`와 `camp-renderer.mjs`에서 로비 사진을 전달한다. 프로필·공유 상태·DB·규약·야간 수광 방식은 유지한다. 이미 실패한 페이지의 이미지 캐시는 새로고침해야 다시 요청한다.
- **회귀:** 중계 수정 후 `npm.cmd test` **226/226**, 파이프라인 **18/18**, 타입 검사·공식 Sites 빌드를 통과했다. 로비 전달 수정 후 영향받는 `view.test.mjs`와 `avatar-proxy.test.mjs` **7/7**, 타입 검사·최종 빌드도 통과했다. 새 Miniflare/workerd 검사는 실제 fetch 옵션 처리로 PNG 성공·리다이렉트 차단을 확인하며 외부 네트워크를 모의 CDN Worker로 대체한다.
- **화면:** `CAMP_QA_AVATAR=1` 로컬 전용 모의 Discord 사진을 추가했다. `browser.avatar.mjs`가 로그인→중계 HTTP 200/image/png→작은 미리보기→큰 로비→솔로 필드의 원색 픽셀을 확인했다. 최종 컴파일 앱은 로비 **216픽셀**, 필드 **496픽셀**의 식별 색을 확인했다. 실제 개인 계정이나 개인 브라우저를 조작한 결과는 아니다. 화면은 `web/outputs/avatar-debug/avatar-lobby.png`, `avatar-field.png`다.
- **장면 계약:** 최종 런타임 지문 `0810eabd9ee180d9e776a5462e5df44c93ef4f8d5d981dc0f589ff05b66b35c1`으로 33개 화면을 새로 캡처·열람·검증해 설치했다. PC/모바일 에뮬레이션·PIP 7개 UI는 실제 사진 로더를 통한 모의 사진을 표시했다. 캡처는 `art/sprites/runs/avatar-proxy-v1/screens/`, 검토는 `art/sprites/field-night-v1/release/review.json`이다. 원본 PNG 27개·조명 계산은 변경하지 않았다. 성능·실물 모바일·NAT·실제 외부 영상 검증을 새로 수행한 것으로 세지 않는다.
- **공개:** 먼저 중계 수정 버전 34를 배포하고, 로비 수정까지 포함한 최종 **버전 35**를 배포했다. URL https://huddlers-fire-camp.gywkd77.chatgpt.site · 배포 `appgdep_6aed642ba0ec81919374615e6b5e423d` **succeeded** · 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_5cd6a439124881919b1d411055646301` · 게시 전용 커밋 `16e5bfdf714585c983b8ba4c99b9802760212504`. 원본 저장소는 커밋·푸시하지 않았다.
- **패키지·공개 검사:** 소스 **260개**의 원본/게시본/Git blob과 빌드 **155개**가 일치했다. 아카이브 `web/outputs/huddlers-fire-avatar-profile-v1-deploy.tar.gz` **9,146,821 bytes**, gzip SHA-256 `6b7b5014fa903e629a239330eef786f9cbee0770f373603cef1a0ab8e5d641ec`, 서비스 tar SHA-256 `e236095e67fa0d7b8b2f398733aab9db5364f71d9917259609da363c3105c56f`. 비밀값·Git·의존성·로컬 상태를 제외했다. 공개 파일 **84개**가 최종 빌드 해시와 일치하고, 방 목록·Discord 준비·미인증 생성 401을 확인했다. 잘못된 사진 경로는 공개 서버에서도 **404**로 정상 처리된다. 실제 사용자의 유효 사진 표시 여부는 사용자가 새로고침한 뒤 확인할 수 있다. public 접근·DB·환경 리비전 **1**을 유지했다.

배포·파일 검사 기록은 `web/outputs/avatar-debug/publication.json`, `deploy-package-check.json`, `deployment-check.json`에 있다. 인증값은 숨겨진 stdin과 메모리로만 전달했으며 전역 설정은 변경하지 않았다.

## INT-19 불멍 야간 조명 공개 배포 · 버전 33 / 규약 v19 (2026-11-06)

사용자 **“배포해줘”** 요청으로 검증한 `field-night-v1`을 기존 공개 사이트에 반영했다. 아래 야간 구현의 로컬 전용 표기는 당시 이력이며, 이번 후속 배포가 해당 경계를 대체한다.

- **공개 결과:** https://huddlers-fire-camp.gywkd77.chatgpt.site · 버전 **33**, 배포 `appgdep_6aed5db510688191b181e137d5deea3c`, 최종 **succeeded**. public 접근·DB 바인딩·런타임 환경 리비전 **1**·규약 **v19**를 유지했다. 새 SQL·환경 변경은 없다.
- **검증 재사용:** 현재 소스와 fingerprint `728528df6a279d16e822046b83b512c412c122d88c5792e4d1315a670a95c35c`의 **33개 화면**이 일치함을 다시 검사했다. 변경 없는 입력의 기존 **225/225 회귀·18/18 파이프라인·35개 Canvas 장면·타입·빌드·컴파일 앱 UI 검증**을 재사용했으며 이번 실행으로 세지 않는다. 런타임 입력 **193개**가 최종 검증 빌드보다 새롭지 않다.
- **게시 소스·패키지:** 소스 **259개**의 원본/게시 작업본/Git blob과 빌드 **155개 파일**의 해시가 일치한다. 게시 전용 저장소 커밋·푸시는 `4a4889de1fa58a1ae40b734e388a7a157a561b68`, 저장 버전은 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_5c8790c25544819193fd32f33b11de0c`이다. 원본 저장소 전체를 커밋·푸시하지 않았다. 패키지 검사에서 게시 복사본의 로컬 `.wrangler` 임시 폴더를 제외하고 공식 helper로 다시 포장했다.
- **아카이브:** `web/outputs/huddlers-fire-night-v1-deploy.tar.gz` **9,146,891 bytes**, gzip SHA-256 `8fc0bad52a1616d157d42325db3308972c3ada38b34fedfbc5bbb8543f79afa8`. Sites 저장 tar 해시는 `40ec70bde5c2eac74efd35e130c1c611b308d193fb0332a065af750bd3aa5e00`이다. 비밀값·Git·의존성·로컬 실행 상태를 포함하지 않는다.
- **공개 확인:** HTML·JS/CSS·Worker·게임/스프라이트·음원 등 **84개 파일**을 게시 빌드와 SHA-256 대조했다. 공개 manifest의 `field-night-v1`·PNG **27개**, 방 목록 HTTP **200**, `discordAvailable:true`, 미인증 방 생성 **401**을 확인했다. 사용자 방·로그인 세션은 만들지 않았다. 준비·패키지·배포 결과는 `web/outputs/night-publish/`에 보존했다.

이번 검사는 공개 파일/API 확인이다. 아래 로컬 화면·성능 검토의 일시적 프레임 지연과 실물 휴대전화·실제 외부 미디어·인터넷 환경의 미확인 범위는 유지한다. 열린 페이지는 새로고침하면 야간 빌드를 받는다.

## INT-19 불멍 야간 조명 · field-night-v1 (2026-11-06, 로컬)

사용자가 **밤을 전제로 모닥불 중심의 전체 스프라이트 수광을 재구성하는 계획**에 **“계획대로 구현”**을 선택했다. 불멍 맵에 밤 주변광·세계 거리/높이 감쇠·모닥불/랜턴 직접광을 적용했다. 기본 얼굴은 둥근 노멀 캐시, 몸 번호 표식은 수광 대상으로 처리했다. 노멀 없는 스프라이트도 같은 밤 노출을 받고, 불꽃·사진·미디어·이름표의 역할을 구분한다. 실제 야간 UI에서 읽기 어려웠던 상태·시간·이동 안내의 글자 대비를 해당 필드에 한정해 보완했다.

- **검토·설치:** [기본 근접](../art/sprites/field-night-v1/release/screens/camp-close.png), [이전/야간 비교](../art/sprites/field-night-v1/release/screens/night-comparison.png), 약한 불/강한 불·무광원·노멀 없음·랜턴·다크·16명 동작/연쇄·WebGL 손실/복구/Canvas·PC/모바일/PIP 등 **33개 검토 PASS**. [review](../art/sprites/field-night-v1/release/review.json)와 [evidence](../art/sprites/field-night-v1/release/evidence.json)는 fingerprint `728528df6a279d16e822046b83b512c412c122d88c5792e4d1315a670a95c35c`에 묶었다. UI 7개는 최종 빌드 앱에서 다시 캡처·열람했다.
- **회귀:** 최종 **225/225 PASS**, 자산 파이프라인 **18/18 PASS**, Canvas 직접 렌더 **35개 장면 PASS**, **typecheck/build PASS**. 전체 회귀에서 드러난 모의 창 문서의 Canvas 생성 호환성을 수정하고 다시 225개를 통과했다. 초기 성능 하네스의 중복 자동 RAF 예약에 따른 타임아웃은 하네스를 수정한 뒤 새 표본으로 대체했다.
- **실제 GPU 검사:** 노멀 없이도 주변광/직접광이 적용되고 거리·확대·발광/사진 예외·투명도를 보존한다. 기준색 192의 무광원 출력 `[36,44,60]`, 근접광 `[211,159,100]`은 노멀 끄기와 카메라 변경 후에도 유지됐다. 같은 초기 마스크 캐시의 놀이터/전시장 컬러·다크 4장면은 직전 렌더러와 최종 픽셀 차이 **0**이었다. 검사는 GPU 반올림 1단계까지 허용하며 자연스러움 판정과 구분한다. 별도 기록은 `web/outputs/night-v1/gpu-contract.json`이다.
- **자산·상태:** 기존 색상/노멀 PNG **27개 모두 SHA-256 동일**. 새 원화나 디스크 노멀 PNG를 만들지 않았다. `asset-preservation.json`을 검토 묶음에 보존한다. 테마별 alpha 차이를 반영하도록 그림자 마스크 캐시 키를 보완했다. 공유 물리·API·규약 **v19**·DB·원본 Git의 커밋·원격 상태는 유지했다. **공개 배포·커밋·푸시는 하지 않았으며 공개 버전 32와 구분한다.**

최종 성능은 같은 16명 혼합 행동 장면, 120프레임 준비/360프레임 표본, **RTX 5070 / ANGLE D3D11**이다. [원자료](../art/sprites/field-night-v1/release/browser-metrics.json)는 CPU 제출·rAF 간격·WebGL GPU 타이머를 분리한다. 기준은 직전 `field-shadow-v4`다.

| 화면·경로 | CPU 중앙값 / p95 / 최대 (ms) | GPU 중앙값 / p95 (ms) |
| --- | --- | --- |
| PC 1050×824 DPR1 · 이전 WebGL | 3.2 / 6.5 / 17.8 | 0.84 / 1.95 |
| PC · 야간 WebGL | 3.1 / 5.7 / 26.3 | 1.06 / 2.44 |
| 모바일 화면 모의 390×844 DPR2 · 이전 WebGL | 3.3 / 6.3 / 12.0 | 0.97 / 2.11 |
| 모바일 화면 모의 · 야간 WebGL | 3.6 / 5.9 / 41.2 | 1.30 / 2.30 |
| PC · 야간 Canvas | 2.3 / 5.0 / 13.8 | 해당 없음 |
| 모바일 화면 모의 · 야간 Canvas | 2.5 / 7.2 / 29.2 | 해당 없음 |

GPU 텍스처 추정치는 두 야간 화면 모두 약 **49.6MB**, Canvas 색 보정 캐시는 최대 **15,329,512 bytes**로 16MB 한도 이내였다. 전체 메모리·드라이버/프레임버퍼를 포함한 수치가 아니다. 최종 표본에는 야간 WebGL CPU 최대 26.3/41.2ms의 일시 지연이 있었으며 p95만으로 모든 프레임의 시간 한도를 충족했다고 해석하지 않는다. 실제 휴대전화의 FPS·발열은 미확인이다.

브라우저 검사는 임시 headless Chrome과 loopback API/SQLite·Discord/YouTube fixture를 사용했다. 개인 브라우저·데스크톱 UI를 조작하지 않았고 실제 외부 영상 디코딩/음향·인터넷/NAT·커뮤니티 선호는 검증하지 않았다. 로그·비교용 이전 런타임·GPU 검사·성능 하네스 결과는 `web/outputs/night-v1/`에 보존한다.

## INT-19 스프라이트 윤곽 그림자 공개 배포 · 버전 32 / 규약 v19 (2026-11-06)

사용자 **“스프라이트 윤곽 사용 수정본을 배포해줘”** 요청으로 `field-shadow-v4`를 기존 공개 사이트에 반영했다. 아래 v3/v4의 로컬 전용 표기는 수정 당시의 이력이며, 이 후속 배포가 해당 경계를 대체한다.

- **공개 결과:** https://huddlers-fire-camp.gywkd77.chatgpt.site · 버전 **32**, 배포 `appgdep_6aed45958ca08191b2391f7d719ab25a`, 최종 **succeeded**. public 접근·DB 바인딩·런타임 환경 리비전 **1**·규약 **v19**를 유지했다. 새 SQL·환경 변경은 없다.
- **검증:** 재질 검토를 다시 검사해 fingerprint `979ab2a8c3156a665c86244d5a56a0a71c2af0ee79c047894429e067fb85c5a7`의 **30개 화면**과 현재 코드·자산의 일치를 확인했다. 변경 없는 입력의 기존 **221/221 회귀·18/18 파이프라인·35개 Canvas 장면·타입/UI 검증**은 재사용했으며 이번 실행으로 세지 않는다. 공식 `build-site.mjs`로 새 배포 빌드를 완료했다.
- **소스·패키지:** 런타임 입력 **193개**가 빌드보다 새롭지 않고, 게시 소스 **257개**의 원본/작업본/Git blob 바이트와 빌드 파일 **155개**의 SHA-256이 일치한다. 게시 전용 `.gitattributes`로 검토한 줄바꿈을 보존했다. 게시 저장소 커밋·푸시는 `fba3e39720775fc9f58eb25a750f881c36f35838`, 저장 버전은 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_21caa8e7ead48191bd38e0d780f99cd7`이다. 원본 저장소 전체를 커밋·푸시하지 않았다.
- **아카이브:** `web/outputs/huddlers-fire-shadow-v4-deploy.tar.gz` **9,140,524 bytes**, gzip SHA-256 `780cdf2e4fed6db460fefd48a476779f6ae0cab0affb3fc2f211433c92dc1c74`. Sites 저장 tar 해시는 `1f158d74f4a39ff97c9d16a23902ac07a10aa9b4494a2f67f5e0d66e8669536d`이다. 비밀값·Git·의존성·로컬 상태를 포함하지 않는다.
- **공개 확인:** HTML·JS/CSS·Worker·게임/스프라이트·음원 등 **84개 파일**을 게시 빌드와 해시 대조했다. 공개 manifest의 `field-shadow-v4`·PNG **27개**, 방 목록 HTTP **200**, `discordAvailable:true`, 미인증 방 생성 **401**을 확인했다. 사용자 방·로그인 세션은 만들지 않았다. 로그·입력·패키지·배포 검사는 `web/outputs/shadow-publish/`에 보존했다.

이번 공개 검사는 파일/API 확인이다. 기존 로컬 화면 검토의 실물 휴대전화·실인터넷·YouTube 음향·커뮤니티 선호 한계를 확장하지 않는다. 열린 페이지는 새로고침하면 새 빌드를 받는다.

## INT-19 그림자 농도 재조정 · field-shadow-v4 (2026-11-06, 로컬)

사용자가 v3 수정본의 그림자가 거의 보이지 않는다고 지적했다. 투영의 거리 감쇠를 제곱에서 선형으로 바꾸고 계수를 .24에서 .48로 올렸다. 중간 거리/광량 .75 예시는 .045 → .18이다. 시설 접촉 계수는 컬러 .2 → .5 / 다크 .28 → .55, 서 있는 캐릭터의 접촉 계수는 .3 → .6으로 보정했다. 원화 윤곽·그림자 길이·공통 광원·합성 순서는 유지했다.

- 일반 모닥불 광량의 기본/근접 카메라에서 먼저 농도를 검토했다. [비교 이미지](../art/sprites/field-shadow-v4/release/screens/shadow-contrast-comparison.png), [근접](../art/sprites/field-shadow-v4/release/screens/camp-close.png), [모바일](../art/sprites/field-shadow-v4/release/screens/ui-mobile-field.png)을 보존한다. v3의 명암 가독성 통과 판단은 정정하고 당시 검토본은 보존했다.
- 새 fingerprint `979ab2a8c3156a665c86244d5a56a0a71c2af0ee79c047894429e067fb85c5a7`의 전체 **30개 검토 PASS**. 다크·랜턴/접촉만·혼합 행동·업기·WebGL 손실/복구/Canvas·실제 PC/모바일/PIP를 확인했고 UI 7개는 빌드 앱에서 다시 캡처·확인했다. 67프레임 4판과 수치 노멀 2판은 v3와 같은 PNG 바이트다.
- **221/221 회귀, 18/18 파이프라인, 35개 Canvas 장면, typecheck/build PASS**. 기본 `sprites:build` 재현·설치도 통과했다. 코드·자산·검토 연결 검사와 실제 명암 판단을 구분한다. 농도 선택 자체를 임의의 미감 점수로 자동 판정하지 않았다.
- 원화/노멀 PNG 27개의 바이트·물리·API·규약 v19는 유지한다. 성능은 이번 농도 변경에서 새로 측정하지 않았으며 v3 수치를 v4의 새 측정값으로 보고하지 않는다. 실행 로그는 `web/outputs/shadow-v4/`다. 공개 배포·커밋·푸시는 하지 않았다.

## INT-19 후속 그림자 수정 · field-shadow-v3 (2026-11-06, 로컬)

사용자의 수정 요청으로 아래 재검토에서 확인한 결함을 고쳤다. 공개 버전 31·규약 v19·DB·공유 물리는 유지한 로컬 수정본이며 배포·커밋·푸시는 수행하지 않았다. 이전 배포본과 [전후 비교](../art/sprites/field-shadow-v3/release/screens/shadow-comparison.png)를 남겼다.

- **형태와 접촉:** 늘린 타원을 실제 원화 alpha·몸 합성의 투영으로 교체했다. 시설의 표시 크기/방향과 착석 보정은 렌더와 마스크가 공유한다. 벤치 다리의 접촉 구간과 다리 사이 여백을 보존하고, 공중 캐릭터는 유한 길이·높이 감쇠를 사용한다. 고정 우하향 투영은 제거했다.
- **공통 광원/순서:** 모닥불·랜턴·좌우 진단광 모두 같은 세계 광원 배열을 사용한다. 품질 단계도 번짐·그림자·셰이더 이전에 한 번 선택한다. 정적/캐릭터 그림자 모두 사물 이전 지면 패스에 있으며, Canvas와 WebGL에서 같은 둥근 등각 지면 경계를 적용한다.
- **성능 보완:** 새 포즈에서 마스크를 만드는 비용을 프로파일로 확인했다. 캐릭터 작업 해상도를 절반으로 줄이고 최대 256개를 캐시하며, 정적 접촉/광원별 투영은 분리해 깜빡임에 재생성하지 않는다. 다크 초기 진입은 이미 로딩한 다크 원화를 사용한다. 원형 사진을 마스크에 읽지 않는다.
- **검토 하네스:** 기존 28개에 랜턴 단독·점광원 없는 접촉 장면을 더해 **30개**로 검토했다. 좌우 진단에는 같은 광원 배열과 실제 활성 그림자 raster의 이동을 요구하며 셰이더만 움직인 증거를 거절한다. 전시 이미지는 디코딩 후 다시 그려 캡처하여 빈 전시판을 통과시키지 않는다. [검토](../art/sprites/field-shadow-v3/release/review.json)와 [evidence](../art/sprites/field-shadow-v3/release/evidence.json)는 fingerprint `6ef33c4be8a3590107175c7365099615adf5dc50f742f0f30ed8027972942a75`에 묶었다. 실제 UI 7개는 정식 설치 후 빌드 앱에서 다시 캡처·열람했다.

| 확인 | 결과 |
| --- | --- |
| 전체 회귀 | **221/221 PASS**. 벤치 다리 사이 alpha 여백/접촉, 랜턴 이동, 그림자의 지면 패스 순서, 품질 단계 공통 광원, 등각 clip, 다크 초기 소스, 잘못된 진단 증거 거절 추가 |
| 자산 파이프라인 | **18/18 PASS**, 기본 `sprites:build`로 최종 검토본 재현·재검증·설치 PASS |
| Canvas 회귀 | **35개 장면 PASS**. WebGL 품질/성능 증거와 구분 |
| 실제 WebGL/Canvas | 세 맵 컬러·다크, 진단광/노멀 끄기/접촉/랜턴, 행동·업기·67프레임, 손실/복구/강제 Canvas, PC/모바일/영상/PIP **30개 검토 PASS** |
| 빌드 앱 UI | PC 1280×900 / 모바일 390×844 / 실제 Document PIP 560×480에서 WebGL·노멀 draw·입력/패널/영상 공간 PASS. `test:browser:appearance`의 테마·저장/새로고침·초안·탭·팝업 초점 PASS |
| 타입·빌드·lint | PASS / PASS / 오류 0. 기존 `camp-world.mjs` 미사용 `COLORS` 경고 1개 유지 |

원화/노멀 PNG 27개는 이전과 같은 바이트이며 새 디스크 이미지 자산을 생성하지 않았다. 최종 재질 묶음과 포인터만 새 버전으로 보존했다. 중간 로컬 검토본은 ignored 작업 폴더에 보존하고 공개된 최초 검토본은 변경하지 않았다. 물리·RTC·API를 바꾸지 않아 실제 16인 RTC는 재실행하지 않았으며 앞선 통과를 이번 실행으로 세지 않는다. 검사는 임시 headless Chrome과 loopback QA API/SQLite로 수행했고 개인 브라우저·데스크톱 UI는 조작하지 않았다. 로그는 `web/outputs/shadow-v2/`에 있다.

최종 성능은 동일한 16명 행동 장면, 120프레임 준비/360프레임 표본, **RTX 5070 / ANGLE D3D11**이다. [원자료](../art/sprites/field-shadow-v3/release/browser-metrics.json)의 전체 조명 결과는 다음과 같다.

| 화면 | CPU 중앙값 / p95 / 최대 (ms) | GPU 중앙값 / p95 / 최대 (ms) | 텍스처 추정치 |
| --- | --- | --- | --- |
| PC 1050×824 DPR1 | 2.7 / 4.3 / 8.8 | 0.54 / 1.32 / 2.89 | 49,559,660 bytes |
| 모바일 화면 모의 390×844 DPR2 | 2.9 / 4.5 / 16.0 | 0.66 / 1.71 / 9.42 | 49,597,416 bytes |

CPU p95는 최초 조명 검토의 3.2ms보다 증가했다. 원래 Canvas 대비 추가 2ms 목표를 충족했다고 보고하지 않는다. 캐시·반해상도 처리로 비용을 제한했으며 rAF p95는 두 화면 모두 약 4.3ms였다. 이는 240Hz PC의 렌더 제출/GPU 측정이고 실제 휴대전화 FPS·발열이나 전체 메모리를 뜻하지 않는다. 이번 수정의 합성 품질 확인과 실기기 성능·실제 YouTube 음향·커뮤니티 선호의 미확인 범위를 구분한다.

## INT-19 그림자 재검토 정정 (2026-11-06)

공개 버전 31 이후 사용자 지적에 따라 보존한 실제 PNG 4개와 `camp-shadows.mjs`, `camp-renderer.mjs`, `lighting-preview.mjs`를 재검토했다. 긴 타원 투영의 형태/접촉 문제, 고정광·모닥불·랜턴 처리 불일치, 캐릭터 그림자의 합성 순서, 셰이더 광원만 이동하는 진단 장면의 한계를 확인했다. **기존 28개 검토 중 그림자 자연스러움의 pass 해석을 철회하며 미해결로 남긴다.** 상세 원인과 관찰 범위는 [제품 검토](product-review.md)의 최신 절에 있다. 기존 기술 검사·공개 파일 해시 결과는 유효하지만 이 품질 결함을 검증한 근거는 아니다. 이번 작업은 진단·기록이며 실행 코드·공개 버전은 바꾸지 않았다.

## INT-19 후속 공개 배포 · 버전 31 / 규약 v19 (2026-11-06)

사용자 **“배포 커밋 푸시해줘”** 요청으로 검증한 조명·그림자·노멀맵을 기존 사이트에 공개했다. 아래 초기 로컬 검증의 배포 제외 경계는 이 후속 요청으로 대체한다.

- **공개 결과:** https://huddlers-fire-camp.gywkd77.chatgpt.site · 버전 **31**, 배포 `appgdep_6aecdff497008191b24d4cb17a06161a`, 최종 **succeeded**. 기존 public 접근·접근 리비전 **2**·DB 바인딩·런타임 환경 리비전 **1**과 규약 **v19**를 유지했다. 새 SQL·환경 변경은 없다. 새 조명을 보려면 기존 페이지를 새로고침해야 한다.
- **검증 재사용과 빌드:** 앞선 동일 런타임의 215/215 회귀·17/17 파이프라인·35개 Canvas 장면·28개 실제 화면·PC/모바일/PIP·16인 RTC 통과를 재사용했다. 이번 요청에서 재질 review 28개와 runtime/빌드 PNG를 재검증하고 공식 `build-site.mjs`로 다시 빌드했다. 런타임 입력 **192개**가 빌드보다 새롭지 않고 게시 소스 **256개**와 빌드 파일 **155개**의 SHA-256이 일치함을 확인했다.
- **게시 소스:** 공식 도우미의 최종 커밋·푸시는 `8ef28c1a49abe80db849412a77d32ce1516d4ffc`다. 저장 버전은 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_f8d9e452352c81919d0fe2ffe70bae78`이다. source 256개 모두 Git blob과 빌드 입력의 바이트가 일치한다. archive는 `web/outputs/huddlers-fire-lighting-deploy.tar.gz` **9,136,640 bytes**, gzip SHA-256 `164779a90579decb31efc5faaad29ad40525516edd2f910763dcff5c128ce6cc`, Sites 저장 tar 해시는 `5c70cad22aee6719146c4f7f573b9208588be49274a66eca337d27b6b26a7d6d`다. 비밀값·Git·의존성·로컬 상태·제작 도구를 제외했다.
- **준비 중 정합성 수정:** 게시 저장소의 Windows 소유권 차이는 해당 helper 실행에만 `safe.directory`를 적용했다. 전역 Git 설정을 바꾸지 않았다. 최초 저장 버전 **30**은 기존 8개 파일의 줄바꿈 캐시 차이를 확인해 **배포하지 않았다**. 공개 전에 해당 게시 index를 다시 정규화했고, 전체 Git blob 바이트 대조가 통과한 새 저장 버전 31만 배포했다. 앱 동작과 빌드 파일은 같으며 게시 소스의 재현성을 보정한 것이다.
- **공개 확인:** HTML·JS/CSS·음원·Worker·게임/스프라이트 등 **84개 파일**을 배포 빌드와 해시 대조했다. 정식 PNG **27개**와 노멀 manifest, 방 목록 HTTP **200**, `discordAvailable:true`, 미인증 방 생성 **401**, 잘못된 avatar 경로 **400**, avatar 쓰기 메서드 **405**를 확인했다. 사용자 방·로그인 세션은 만들지 않았다. 결과는 `web/outputs/lighting/{deploy-inputs,deploy-package-check,deployment-check}.json`, 빌드 로그는 `deploy-build.log`다.
- **원본 저장소:** `origin/main`과 시작 HEAD가 일치함을 확인했다. 기존 조명·자산·하네스 변경과 이번 배포 기록을 함께 원본 main에 보존한다. 게시 전용 저장소와 원본 저장소의 커밋은 별개다.

공개 확인은 파일/API 검증이며 로컬 화면·성능 검증의 실물 휴대전화·실제 인터넷/NAT·YouTube 음향 한계를 확장하지 않는다.

## INT-19 · 그림자·2D 조명·노멀맵 (2026-11-06, 로컬)

사용자의 전체 구현 계획 승인에 따라 기존 필드 v2에 재질 채널·접촉/투영 그림자·광원·WebGL2/Canvas 경로와 검증 하네스를 구현했다. 공유 좌표·물리·규약 v19·DB 스키마는 유지했다. 배포·커밋·푸시는 수행하지 않았으며 아래 공개 버전 29는 INT-18의 결과다.

### 구현과 검토 묶음

- PixiJS **8.14.3**을 고정했다. 동일한 투영·정렬·상하체 혼합/클립을 사용하고 원래 Canvas가 입력·HUD를 맡는다. WebGL 미지원·초기화 실패·컨텍스트 손실 시 Canvas, 복구 시 WebGL로 전환한다. 사진은 고정 Discord CDN 전용 읽기 경로를 사용한다.
- 모닥불/가까운 랜턴 **최대 3개**, 화면 밖 광원 제외, 유한 높이 차폐, 정적 절반 해상도 그림자/바닥 노멀, 빛 번짐 캐시, 공통 uniform과 비조명 Sprite 배치, 텍스처 수명 관리·80MB 추정 한도, 프레임 지연에 따른 보조광 축소를 적용했다. 모션 감소는 깜빡임을 멈추고 연료 변화를 유지한다.
- 기존 색 PNG **22개는 바이트 그대로 보존**했다. 형태 기반 노멀 **5개 / 438,605 bytes**를 추가해 총 **27개 / 7,294,519 bytes**다. 가장 큰 장면 로딩 집합은 캠프/놀이터 컬러 **4,255,916 bytes**로 전체 10MB·장면당 6MB 한도 안이다. 색 원화의 명암을 높이로 복원하거나 신규 AI 색 원화를 생성하지 않았다.
- [정식 재질 묶음](../art/sprites/field-lighting-v1/release/review.json)은 **28개** 실제 PNG의 관찰을 포함한다. 세 맵×컬러/다크, 16명 착석/혼합 행동/업기, 67프레임 4판, 좌/우 진단광·노멀 끄기·근접, Canvas 강제/손실/복구, PC/모바일 필드·패널·영상·실제 Document PIP, 두 수치 아틀라스를 열람했다. 실제 UI 7개는 **정식 설치 후 빌드한 앱에서 재캡처**했다. [evidence](../art/sprites/field-lighting-v1/release/evidence.json)의 fingerprint는 `9e0d27c573ab120d571f1d9319e4d50e06838744170a25e5b6eaa3781439c78b`다.
- 설치 gate는 원화·노멀·명세·생성기·런타임·캡처 소스 해시, PNG 해시/크기, backend·노멀 draw, 장면별 pass 관찰과 미해결 유무를 검사한다. 대표 5개 검토는 전체 설치를 대신하지 못한다. 기본 `sprites:build`로 검토본을 재생성·재검증·설치했고 같은 27개 manifest를 얻었다.

### 실행 결과

| 검사 | 결과 |
| --- | --- |
| `npm.cmd test` | **215/215 PASS**. 기존 201개와 조명·변환·차폐·노멀/사진·검토 gate 14개 |
| `npm.cmd run test:sprites:pipeline` | **17/17 PASS**. 채널/크기/해시·대표/전체 범위·오래된 검토·Canvas를 WebGL 증거로 제출한 경우 거절 포함 |
| `npm.cmd run test:render` | **35 시나리오 PASS**, Canvas 폴백 장면·클릭/가림 회귀. WebGL 검증과 구분 |
| `test:browser:lighting` / `test:browser:lighting:ui` | 최종 fingerprint의 전체 28개 캡처·실제 WebGL 노멀 draw·컨텍스트 손실/복구와 실제 PC/모바일/PIP PASS |
| `test:browser:community` | 빌드 앱의 좌석·이동·입장·초안·라디오·PIP·종료/복구 PASS. 브라우저 예외 없음 |
| `test:browser:exhibition` | 빌드 앱 PC/모바일 포탈 실제 이동·두 게임 공식 이미지/트레일러/링크·모달 입력/초점 PASS. 브라우저 예외 없음 |
| `test:browser:appearance` | 빌드 앱 PC/모바일 컬러·다크 전환·설정 저장/새로고침·채팅 초안·탭·팝업 초점 PASS |
| `test:network` | **실제 loopback 16인/15 DataChannel**, 놀이·음악·재연결·정상/강제 승계·상태 전송 손실·스케줄 지연 회복 PASS, 최종 epoch 5, HTTP 1,481회 |
| `typecheck` / `build` / `lint` | PASS / PASS / 오류 0. 기존 `camp-world.mjs`의 미사용 `COLORS` 경고 1개 유지 |
| 빌드 산출물 | 정식 PNG 27개, client JS 29개에 미리보기 서버/작업 경로·캡처 코드 노출 0 |

정식 재질 묶음의 전체 review 재검증, 27개 runtime/빌드 PNG 해시·22개 색 원본 불변, 수정 문서·스킬의 로컬 참조 경로와 `git diff --check`를 확인했다. 전역 설정과 다른 세션의 파일을 변경하지 않았다.

실행 로그는 `web/outputs/lighting/final-*.log`, 실제 성능 원자료는 [browser-metrics.json](../art/sprites/field-lighting-v1/release/browser-metrics.json)에 둔다. 개인 브라우저·데스크톱 앱을 조작하지 않았다. 임시 headless Chrome과 loopback QA API/SQLite를 사용했다. 제한 환경에서는 Worker 시작 시 상위 디렉터리 접근 오류, Chrome CDP 시간초과가 발생해 해당 로컬 검증 프로세스만 제한 해제하여 실행했다. 애플리케이션 코드나 오류 이벤트를 숨겨 통과시키지 않았다. 개발 중 PIP/resize에서 기존 ResizeObserver 알림을 관찰했으며 빌드 앱 최종 검사에는 런타임 예외가 없었다.

### 성능과 확인 한계

동일한 16명 행동 장면·120프레임 준비 후 360프레임을 측정했다. 비교 원본은 작업 전 HEAD `1fb28c7`의 렌더러를 별도 출력 폴더에 복원했고 Git checkout은 변경하지 않았다. **RTX 5070 / ANGLE D3D11** 환경이다. CPU는 제출 시간, GPU는 WebGL timer query이며 전체 입력/물리나 드라이버 메모리 수치가 아니다.

| 화면 / 경로 | CPU 중앙값 / p95 (ms) | GPU 중앙값 / p95 (ms) |
| --- | --- | --- |
| PC 1050×824 DPR1 · 기존 Canvas | 0.8 / 1.1 | 측정 불가 |
| PC · WebGL, 표면 조명 끔 | 1.4 / 2.2 | 0.52 / 1.24 |
| PC · WebGL, 전체 조명 | **2.3 / 3.2** | **0.66 / 1.73** |
| 모바일 화면 모의 390×844 DPR2 · 기존 Canvas | 0.9 / 1.2 | 측정 불가 |
| 모바일 화면 모의 · WebGL, 표면 조명 끔 | 1.6 / 2.1 | 0.14 / 0.22 |
| 모바일 화면 모의 · WebGL, 전체 조명 | **2.3 / 3.2** | **0.47 / 1.60** |

같은 WebGL에서 조명·노멀 추가분의 CPU p95는 **+1.0/+1.1ms**다. 기존 Canvas 대비 전체 전환의 CPU p95는 **+2.1/+2.0ms**로, PC는 초기 추가 2ms 목표보다 약 0.1ms 높다. 측정 편차를 이유로 목표 충족으로 바꾸지 않는다. 전체 조명 텍스처 추정치는 **41,694,592 bytes**, rAF p95는 약 4.3ms였으나 240Hz PC 환경의 결과다. 실물 휴대전화의 FPS·GPU·발열·메모리, 실제 인터넷/NAT·Discord 동의·YouTube 디코딩/음향과 커뮤니티 선호는 미확인이다. 그림자·노멀은 형태 근사이며 정확한 3D 복원으로 보고하지 않는다.

## INT-18 후속 공개 배포 · 버전 29 / 규약 v19 (2026-11-06)

사용자 **“배포 커밋 푸시 다 진행해줘”** 요청으로 검증한 새 필드를 기존 사이트에 공개했다. 아래 초기 로컬 검증의 배포 제외 경계는 이 후속 요청으로 대체한다.

- **공개 결과:** https://huddlers-fire-camp.gywkd77.chatgpt.site · 버전 **29**, 배포 `appgdep_6aecb23339b08191a4ec0c63c61e17b1`, 최종 **succeeded**. 기존 public 접근·접근 리비전 2·DB 바인딩·런타임 환경 리비전 1을 유지했다. 새 SQL이나 환경 변경은 없었다. 모든 참가자는 새로고침 후 다시 입장해야 한다.
- **준비:** 공식 Sites 소스 도우미로 기존 게시 전용 체크아웃을 열었다. 배포 빌드가 프로젝트 바깥의 제작 도구를 읽지 않도록 미리보기 플러그인을 개발용 설정에서만 동적으로 로드했다. 이 변경 후 **201/201 회귀, typecheck, 공식 build-site.mjs 빌드 PASS**. 원본 실행 입력 178개가 빌드보다 새롭지 않고 게시 소스 232개와 빌드 파일 136개의 SHA-256이 일치함을 확인했다.
- **게시 소스/저장:** 공식 도우미의 커밋·푸시 `60877a4c1744167f44f01c42c0497b0be062cc74`. 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_b4901592a80481918c153e0f3153cc24`. 로컬 archive는 `web/outputs/huddlers-fire-field-v2-deploy.tar.gz`이며 gzip 파일 SHA-256은 `4ceb1d12727394bda127697d21d6d545e4e90bf087eaee14d0c1460da1f9d45c`, Sites가 저장한 tar 해시는 `ca23c65a53af8b1282a3392dc31a37fc5c48c5d7f3f3c96d62eb94340cf885b1`이다. 제작 원본·도구·비밀값·Git·의존성·로컬 상태를 배포 archive에서 제외했다.
- **공개 검증:** `node outputs/check-field-v2-deployment.mjs 29` PASS. HTML HTTP 200, 정적 파일 **72개**의 로컬 빌드 해시 일치, 새 PNG **22개**·field-v2 manifest·두 벤치 방향/8개 좌석군 연결, 방 목록 HTTP 200, `discordAvailable:true`, 미인증 방 생성 HTTP 401을 확인했다. 사용자 방이나 로그인 세션은 만들지 않았다. 검사 결과는 `web/outputs/field-v2-deployment-check.json`이다.
- **원본 저장소:** 이번 요청에는 게시 전용 저장소와 별도로 원본 `origin/main` 커밋·푸시도 포함한다. 이미 공개됐지만 미커밋이던 연결된 UI/자산 전환과 새 필드·하네스·검토 근거를 함께 기록한다. 검토에 사용하는 소스 15개와 프롬프트 52개는 `.gitattributes`로 기존 바이트를 보존하며 Git index와 작업 파일의 SHA-256 일치를 확인했다. 전역 Git/Codex 설정과 다른 사용자 상태는 변경하지 않았다.

공개 검증은 파일/API 확인이다. 앞서 통과한 PC/모바일 headless와 16인 loopback RTC·승계 근거를 이어 사용했으며 실제 기기/NAT·OAuth 동의·YouTube 음향을 새로 검증했다고 하지 않는다.

## INT-18 · 새 필드 전체 제작/설치 (2026-11-06, 로컬)

승인 범위의 세 맵 배치·동선·캐릭터/시설/지형/효과·카메라·필드 HUD를 재구성했다. 규약은 v19이며 DB·공유 상태 필드·공개 사이트는 변경하지 않았다. 배포·커밋·푸시는 실행하지 않았다. 시작 전 코드/자산 해시와 199개 통과 기준선을 `web/outputs/field-v2-baseline/`에 보존했다.

### 제작과 실제 화면

- 이전 그림을 긍정적 참조로 사용하지 않은 새 원화에서 **52개 자산, 16개 동작 상태, 네 착석 몸 방향, 67프레임**을 만들었다. 고정 sprite-gen `3.15.0 / 4f5ccd55c7cf06685a41f954acc1e476b7772ece`로 분리/타일링했고 앱 어댑터로 여섯 색·여섯 다크를 패킹했다.
- 원형 검토 후 전체로 확대했다. 최종 증거는 **Canvas 9개 + 실제 UI 6개 = 15개**, 추가로 모든 소스 프레임 4장과 혼합 자세를 열어 확인했다. [검토 묶음](../art/sprites/field-v2/release/review.json), [증거 해시](../art/sprites/field-v2/release/evidence.json), [16석](../art/sprites/field-v2/release/screens/camp-seats.png), [모바일 필드](../art/sprites/field-v2/release/screens/ui-mobile-field.png), [모바일 영상](../art/sprites/field-v2/release/screens/ui-mobile-radio.png)을 보존한다.
- 생성 과정에서 들기 손 높이·손 흔들기의 흰 패널·서 있는 웅크리기 프레임을 탈락시키고 재생성했다. 머리 옆 손이 머리 크기 측정을 오염시키지 않도록 원형 측정 후 프레임별 앵커를 고정했다. 벤치의 다리 가림·이웃 얼굴을 덮는 이름표·작은 카드 문구 넘침·영상과 조작의 겹침·다크 반투명 가장자리 잔색을 수정했다.
- 높은 연쇄의 얼굴 선택이 다른 사람의 넓은 몸 영역에 가로채이지 않도록 얼굴을 먼저 판정한다. 6인/16인 연쇄가 화면에 들어오며 각각 선택되는 실제 렌더 검사를 통과했다.
- 전체 빌드는 이전 manifest를 가져오지 않는다. 전체 선택 누락·불투명 캐릭터 패널·다른 원본의 고정 앵커·오래된 검토를 거절한다. 원형 범위에 전체 자산을 넣어 전체 검토를 우회할 수 없다. 재생 중 영상 증거도 전체 설치의 필수 조건이다.

### 실행 결과

| 검사 | 결과 |
| --- | --- |
| `npm.cmd test` | **201/201 PASS**. 상태/물리/좌석/무기/복구/입력/원형 사진/애니메이션/테마/자산/제작 gate 포함 |
| `npm.cmd run test:sprites:pipeline` | 최종 annotation 접촉점 검사 추가 후 **13/13 PASS**. 실제 전체 앵커/원본으로 재빌드해 출력 hash 불변과 15개 검토 재검증도 확인 |
| `npm.cmd run test:render` | 세 맵, PC/모바일, 프로필·혼합 자세, 6/16인 연쇄의 프레이밍/개별 선택, 다섯 불 외형, 이름표·채팅·상태 PASS |
| `npm.cmd run typecheck` / `npm.cmd run build` | PASS. 기존 vinext의 동적 API 경로 분류 안내가 남으며 빌드는 완료됨 |
| `browser.appearance.mjs` | 최종 전체 manifest로 PC 1280×900·모바일 390×844 필드/열린 패널, 테마·저장·모달 포커스·초안·조작 가림 PASS |
| `browser.exhibition.mjs` | 실제 키보드 도보로 세 맵 포털 왕복, 두 게임의 소개/공식 이미지/트레일러/링크·모달 입력 차단·모바일 영상 공간 PASS |
| `browser.community.mjs` | 착석/공동 불/개인 숨김·공동 라디오·초안/호출·PIP·모바일 이동/영상·창 크기·종료 복귀 PASS. YouTube 미디어 API는 격리 fixture이므로 실제 음향을 검증했다고 하지 않음 |
| `network.integration.mjs` | 방장+15명 실제 loopback ICE/DTLS/SCTP 연결, 손실/역순/재동기화, 세 맵·행동·채팅/음악/불 성장, 17번째 거절, 재접속/연쇄·정상 퇴장/강제 종료/전송 손실/실행 지연 승계 PASS. 마지막 epoch 5 |
| 기본 `npm.cmd run sprites:build` | 보존한 전체 검토 묶음에서 재추출/재패킹·검토 재검증·설치 PASS. **이전 자산을 복구하지 않음** |
| 출력/번들 검사 | 설치 PNG 22개 해시 일치, production PNG 22개, production 번들 25개에서 미리보기 경로 누출 0, 이전 PNG 해시 겹침 0 |

개인 브라우저나 데스크톱 UI는 조작하지 않았다. 브라우저 검사는 임시 프로필의 headless Chrome과 loopback fixture다. 최종 공동 기능 검사에서 PIP/뷰포트 전환 시 브라우저의 `ResizeObserver` 지연 알림 **2회**가 발생했다. Canvas resize는 다음 프레임에서 크기가 달라진 경우만 적용한다. 남은 알림이 멎은 것을 확인한 뒤 개발 서버 오버레이를 닫고 화면/입력 검사를 계속했다. 오류 이벤트를 억제하지 않았으며 알림이 없었다고 보고하지 않는다. 이 지연 알림과 실제 무한 반복의 차이는 [MDN의 관찰 오류 설명](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors)을 참고했다. JavaScript 예외는 없었다.

### 용량과 로컬 성능

PNG 합계는 **9,181,523 → 6,855,914 bytes**, 가장 큰 단일 맵/테마 로딩 집합은 **3,828,805 bytes**다. 이전 원본과 이전 public 출력은 이력으로 보존하고 활성 public 출력은 새 22개만 남겼다. 생성 원본·검토 스크린은 런타임 PNG 용량에 포함하지 않는다.

변경 전 스냅샷을 별도 출력 폴더에서 복원해 같은 CLI 측정기로 비교했다. 1050×824, 16명, 워밍업 30회 후 180회 CPU Skia Canvas 측정이며 레이아웃/그림은 각 버전의 상태다. 브라우저 GPU·기기 FPS·실인터넷 성능을 뜻하지 않는다.

| 장면 | 중앙값 전 → 후 (ms) | p95 전 → 후 (ms) |
| --- | --- | --- |
| 불멍 컬러 | 4.69 → 3.61 | 6.59 → 5.47 |
| 불멍 다크 | 4.58 → 3.38 | 5.90 → 4.61 |
| 놀이터 컬러 | 3.82 → 0.73 | 4.73 → 1.09 |
| 놀이터 다크 | 3.62 → 0.84 | 4.53 → 1.22 |
| 전시장 컬러 | 3.65 → 0.77 | 4.72 → 1.05 |
| 전시장 다크 | 3.88 → 0.71 | 4.60 → 1.17 |

아래 공개 배포/이전 파일럿 기록은 이 로컬 검증과 구분한다.

## 2026-11-05 명세·부분 제작·합성 계약·파일럿 구현

- 승인 범위: 하네스와 제작 도구, 표시 계약, 실패 검사, 소량 신규 원본 파일럿. 기존 미커밋 변경을 보존하고 이번 변경 전 22개 관련 파일과 정식 원본/런타임 파일 47개의 해시를 `web/outputs/authoring-baseline/`에 저장했다. 정식 원본·22개 PNG·정식 JS manifest 등 **47개 파일의 해시가 작업 전과 동일**하다. 공개 배포·원본 Git 커밋/푸시·전역 설정 변경은 하지 않았다. 공유 상태·좌석/충돌·규약 v18을 유지했다.
- 신규 생성: 내장 image_gen, 기존 캐릭터를 그림체 참조로 사용한 원본 **5개**(서기·앉기·통나무 두 축·잔디). [원본/출처](../art/sprites/pilot-source/generation.json)에 프롬프트 전체·참조/원본 해시를 보존했다. 외부 사진·공식 게임 콘텐츠는 생성 입력으로 사용하지 않았다. 원본을 정식 자산으로 교체하지 않았다.
- 실제 부분 경로: `node tools/prepare-sprite-job.mjs --out composition-pilot-v2`, `node tools/rebuild-sprites.mjs --job art/sprites/runs/composition-pilot-v2/job.json`, `node web/tests/render-scene-preview.mjs --job art/sprites/runs/composition-pilot-v2/job.json`. 초기 생성 작업에서 프롬프트를 만든 후 맵 ID 연결만 명세에 추가했으며 새 작업의 프롬프트 텍스트는 동일하다. 파생 `request.json`도 현재 compiler 형식으로 보존했다. 공식 slice-sheet와 x/y background-tile, 앱 메타데이터 처리를 실행했다.
- 새 context는 기존 manifest/cache를 교체하지 않는다. 선택한 상태의 sheet·좌면/지면 접촉·방향·depth를 실제 renderer가 사용한다. 작업 manifest는 나머지 기존 자산과 미제작 색/다크(`ungraded`)를 구분한다. 개발 전용 manifest 주입은 `serve`에서만 활성화된다. production JS에서 `composition-pilot`, preview 파일 경로, authoring plugin 문자열이 없음을 확인했다.
- **회귀:** 변경 전 188 PASS → 최종 **199/199 PASS**. 추가 11개는 선택 입력만 실제 고정 도구로 처리, 원본 누락/잘못된 명세·접촉·방향, context 분리, 표시 접촉점·깊이, 정식 자산 비변경, 실패/누락/다른 크기/오래된 캡처 거절, full 준비 제한, 지형 셀 불투명도를 검사한다. gate 테스트의 자동 pass 자료는 합성 fixture이며 실제 미감 검토와 구분한다. `npm.cmd run test:render` **35 시나리오 PASS**, typecheck/build PASS, lint 오류 0·기존 `camp-world.mjs` COLORS 경고 1개.
- **실제 화면:** 작업의 `screens/`에서 세 맵 전체 보기·두 축 착석의 Canvas PNG 5개와 격리 headless Chrome PC 1280×900·모바일 390×844 UI PNG 2개를 열어 검토했다. `browser.appearance.mjs`는 실제 preview 이미지 요청·서버/manifest 일치, 패널/초안·테마 저장/복원·포커스 등을 통과했다. 로그는 `web/outputs/authoring-{unit,render,build,lint,browser}.log`. YouTube는 기존 stub이며 실물 기기/NAT·실제 음향을 검증한 것은 아니다. 이번 변경에 공유 연결 계약이 없어 RTC 검사를 재실행하지 않았다.
- **실패 발견과 수정:** 정상 범위의 잘못된 좌면 .35를 주입해 몸이 통나무로 내려앉는 화면을 확인하고 .73으로 복구한 뒤 재검토했다(`web/outputs/composition-review/bad-seat-ne.png`). background-tile 결과의 작은 크기를 256 셀에 그대로 그려 투명 격자가 생긴 구현 오류를 화면에서 발견했다(`bad-terrain.png`). 셀 전체에 맞춰 합성하고 완전 불투명 회귀를 추가한 뒤 새 Canvas·전체 UI를 생성/확인했다. 최초 headless sandbox 실행은 Runtime.enable 시간초과였고 격리 Chrome 실행만 제한 해제해 검사했다. 리소스 기록 버퍼가 부족해 실제 이미지 요청 확인도 처음 실패했으며 버퍼를 늘려 검증을 유지했다.
- **시각 판정:** 좌면 접촉과 두 통나무 축은 부분 통과지만 정면 몸 방향·나머지 방향·길/포탈·밀도·UI 비중은 미해결이다. [실제 검토](../art/sprites/pilot-source/pilot-review.json)는 해당 장면을 fail로 기록했고 `verifyReview`의 실제 거절을 확인했다(`web/outputs/composition-review/gate-result.json`). 기술 검사 통과를 전체 신규 생성/시각 품질 통과로 바꾸지 않았다.
- **문서/스킬:** 3개 스킬의 frontmatter는 기존 Node js-yaml로 검사하고 로컬 링크·공백·`git diff --check`를 확인했다. Python 기본 검사기의 YAML 의존성은 설치하지 않았다. 하네스 행동 사례 수동 대조와 실제 제작 파일럿은 수행했으며 독립 세션 실행은 수행하지 않았다. 계획/오타 범위·사용자 결정 우선·개인 UI 제한·배포 경계를 유지했다.

## 2026-11-05 장면 구성 재발 방지 하네스·스킬 보완

- 사용자 배치·조화 진단과 후속 재발 방지 요청에 따라 AGENTS에서 [장면 구성 기준](scene-composition.md)을 연결하고 제작·제품 검토·변경 검증 스킬에 생성 전 관계 정의, 대표 장면 선확인, 실제 합성 화면 검토, 기술 통과·시각 검토·미해결의 분리를 반영했다. 기준은 한 문서에서 관리한다. 전역 설정·공통 스킬·게임 실행 코드·자산·공개 사이트는 변경하지 않았다.
- **직전 진단의 실행 근거:** 현재 소스의 `npm.cmd run test:render` 35개 시나리오 PASS. `expanded-camp.png`, `expanded-playground.png`, `showroom-overview.png`, `campfire-focus.png` 등 Canvas 출력과 원본 환경/앉기 그림, 기존 `seed-room-desktop.png` 등 전체 UI 캡처를 읽고 코드와 대조했다. 그림 생성/기능 검사가 통과해도 좌석 방향·접촉·가림, 길·시설 연결, 카메라 밀도, UI 비중 문제가 남음을 관찰했다. 경로는 `web/outputs/`이며 이번에 전체 UI 캡처를 새로 만들지는 않았다. 차이는 [제품 검토](product-review.md)의 최신 절에 미해결로 기록했다.
- **이번 문서 검사:** skill-creator의 `quick_validate.py`를 세 스킬에 실행했으나 기존 프로젝트 Python에 `yaml` 모듈이 없어 실행되지 않았다. 패키지를 설치하거나 전역 환경을 바꾸지 않고 기존 Node `js-yaml`로 frontmatter·이름·설명·미완성 placeholder를 검사했다. 변경 문서의 로컬 Markdown 링크·공백과 `git diff --check`도 확인했다. 구조 검사 결과는 `web/outputs/scene-harness-check.json`에 둔다. 공식 Python 검사 통과로 보고하지 않는다.
- **사례 수동 대조:** [행동 사례](../.agents/skills/camp-product-review/references/intent-cases.md)에 전면 교체·착석 불일치/PASS 로그·라디오 배치·썸네일 단독 변경·전체 UI 확인 불가·하네스만 보완하는 상황을 추가하고 새 규칙의 적용·비적용·의도 보존과 대조했다. 독립 에이전트 실행이나 향후 행동·재발 방지의 보증은 아니다. 기존 계획 전용 무수정·오타 범위 한정·최신 사용자 결정 우선·배포 권한 구분도 유지했다.
- 이번 변경은 하네스·문서뿐이므로 게임 단위 검사·typecheck/build·RTC·브라우저·배포 검사를 다시 실행하지 않았다. **하네스 보완 완료와 기존 화면 결함 수정은 별개**이며 공개 버전 28·규약 v18은 그대로다.

## 2026-11-05 INT-17 일러스트 재구성 공개 배포 · 버전 28 / 규약 v18

- 사용자 후속 “배포해줘” 승인으로 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 공개했다. 배포 전후 get_site에서 기존 public 접근과 같은 URL을 확인했다. DB·런타임 설정은 변경하지 않았으며 환경 리비전 1을 유지했다.
- 공식 `build-site.mjs` 빌드 PASS. 게시 전용 `web/outputs/site-source`에 소스 225개와 빌드 136개를 준비하고 런타임 입력 176개의 원본/게시 소스 일치 및 모든 빌드 파일 SHA-256을 확인했다. 자산 제작 도구·원본 이미지·로컬 상태·비밀값은 앱 배포에 넣지 않았다.
- 공식 source helper가 게시 소스를 커밋·푸시하고 패키징했다. 게시 소스 커밋 `654a6fd15d02b5dceb31c8f8d098ecfd98d63420`, archive `web/outputs/huddlers-fire-sprite-deploy.tar.gz`, 서버가 확인한 SHA-256 `8a38210f9c616f82fc378c11a9f4d78c01c03de83018296fa1aba71aa7154256`. 원본 GitHub 저장소에는 커밋·푸시하지 않았다.
- 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_7a1abb63314c8191b254fb8d6e4c08e6`, 사용자 버전 **28**. 배포 `appgdep_6aec7acc6f288191ae5689e2d9506717`, 최종 **succeeded**, URL https://huddlers-fire-camp.gywkd77.chatgpt.site .
- `node outputs/check-sprite-deployment.mjs 28` PASS. 공개 HTML HTTP 200, 공개 파일 **72개**의 빌드 해시 일치(새 스프라이트 **22개**, 16상태 manifest, JS/CSS·타이머 Worker·기존 게임/음원 포함), 방 목록 HTTP 200, `discordAvailable:true`, 미인증 방 생성 HTTP 401을 확인했다. 결과는 `web/outputs/sprite-deployment-check.json`. 사용자 세션·방은 만들지 않았다.
- 최초 source helper는 Windows 실행 계정과 게시 저장소 소유자의 차이로 Git 접근을 거절했다. 해당 게시 경로만 프로세스 한정 `safe.directory`로 허용해 재시도 성공했다. 인증값은 메모리와 숨겨진 stdin으로만 전달했고 전역 설정을 변경하지 않았다.
- 이번 공개 확인은 파일/API 검사다. 기존 188개 회귀·격리 브라우저·16인 loopback RTC 결과를 재사용했으며 실물 기기/NAT·실제 OAuth 동의/YouTube 음향을 추가 검증했다고 주장하지 않는다. **v18 적용으로 모든 참가자는 새로고침 후 다시 입장해야 한다.**

## 2026-11-05 INT-17 일러스트 전면 교체 · 로컬 규약 v18

sprite-gen 기반 16상태/63프레임 캐릭터, 환경·효과 28종, 세 맵 지형과 로비/게임 UI를 연결했다. **188개 회귀·Canvas 렌더·typecheck·build, 격리 headless 데스크톱/모바일 3개 시나리오군, 16인 loopback RTC가 통과했다.** 최종 PNG는 22개/9,181,523 bytes이며 로컬 CPU Canvas 중앙값은 기존 1.1~1.5ms에서 3.8~4.2ms로 증가했다. 실기기 FPS 수치가 아니다. 원본 재생성과 전체 프레임/혼합 자세를 확인했고 배포·커밋·푸시는 하지 않았다. 실패/재시도·측정 조건·잔여 한계와 산출물은 [이번 상세 검증](sprite-validation.md), 제작·출처는 [자산 계약](sprite-assets.md)에 기록한다. 아래 공개 버전 기록은 이전 배포 이력이다.

## 2026-11-05 SEED 전면 재구축 공개 배포 (버전 26·규약 v17)

- 사용자 후속 “배포해줘” 요청에 따라 INT-15 검증본을 기존 사이트에 배포했다. 사전/사후 get_site에서 같은 프로젝트·URL·public 접근을 확인했다. DB 스키마와 런타임 설정은 변경하지 않았고 환경 리비전 1을 유지했다.
- 공식 Sites build-site.mjs 빌드 통과. 런타임 입력 143개가 빌드보다 새롭지 않음을 확인했다. 게시 전용 outputs/site-source에 소스 187개를 복사·해시 대조하고 삭제된 옛 UI 파일을 제거했다. Worker/client 빌드 파일 110개도 해시 일치를 확인했다. 비밀값·로컬 상태는 제외했다.
- 공식 source helper로 게시 저장소에 commit 95796062a2ab26b74b29cce45aa3586c5a4c2041을 반영하고 동일 빌드 아카이브를 저장했다. 원본 프로젝트 Git 저장소는 커밋·푸시하지 않았다. 저장 버전 26: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_89c61cdcb5a481918a9f822da1664655. 배포 appgdep_6aec560c24288191a1998c7dc13f7d7f가 succeeded를 반환했다.
- 공개 주소: https://huddlers-fire-camp.gywkd77.chatgpt.site . node outputs/check-seed-deployment.mjs 26 통과. HTML/공개 방 목록 HTTP 200, JS/CSS·이미지·음원/출처 등 공개 파일 36개와 타이머 Worker 1개의 빌드 해시 일치, 새로운 SEED 패널/입장창/빈 상태 코드, Discord 준비 상태와 미인증 방 생성 401을 확인했다. 공개 사용자 세션이나 방은 만들지 않았다. 결과는 web/outputs/seed-deployment-check.json이다.
- 아래 로컬 구현 당시의 미배포 경계는 이 후속 요청으로 해당 변경에 한해 대체된다. 모든 기존 참가자는 새로고침 후 규약 v17로 다시 입장해야 한다. 실제 외부 OAuth/영상·실물 모바일·인터넷 NAT의 미검증 범위는 그대로다.

## 2026-11-05 기존 시각 계층 제거·SEED 전면 재구축 (INT-15, 로컬 v17·미배포)

- 사용자 지적과 재승인에 따라 기존 흑백 전환을 부분 구현 이력으로 정정하고 새 시각 계층을 구현했다. 기존 미커밋 작업을 유지했으며 전역 설정·공유 스킬·DB 스키마·공개 사이트는 변경하지 않았다. 현재 공개 버전 25/v16과 로컬 v17을 구분한다.
- 공식 SEED CLI로 생성한 ActionButton/TextField/Tabs/Avatar/Badge/List/Select/SelectBox/Snackbar/Callout/ResultSection과 SEED BottomSheet/Dialog를 실제 화면에 연결했다. 로비·생성/코드 입장·패널·설정·사람·게임 소개를 재구성했다. 기존 UI 폴더 61개 파일, components.json, 클래스명으로 variant를 추론하던 controls.tsx 및 사용하지 않는 UI 의존성을 제거했다. 공식 출처 주석과 프로젝트 내부 설정을 유지했다.
- 기존 시각 CSS와 장면 그림을 제거하고 새 camp-layout.css, 토큰 전용 camp-theme.css, camp-artwork.mjs 및 둥근 사각 캐릭터를 적용했다. 맵 외곽 장식/충돌 배치가 달라져 규약 v17로 변경했다. 외부 프로필·게임 이미지·영상의 원색과 기존 기능/상태 의미는 유지한다.
- `npm.cmd test`: **179/179 통과**. 맵 재배치 후 예전 장애물 좌표를 하드코딩한 던지기·탄환 검사 2개가 실패한 것을 확인했다. 현재 맵의 실제 crate 앞뒤에서 같은 충돌 차단을 검사하도록 갱신한 뒤 전체 통과했다. 실패를 물리 규칙 완화로 해결하지 않았다.
- `npm.cmd run typecheck`, `npm.cmd run build`: 통과. 변경한 앱/캠프 컴포넌트·공식 스니펫·그림/맵/규약·관련 브라우저/물리 테스트의 targeted ESLint와 `git diff --check` 통과. 빌드의 vinext 경로 자동 분류 안내는 유지된다.
- `npm.cmd run test:render`: **35개 Canvas 렌더 시나리오 통과**. 세 맵·부스·16인·모바일·연쇄/자세·장난감/폭탄 범위·다섯 불 형태·reduced-motion·이름표를 확인했다. Canvas 직접 렌더 결과이며 실제 브라우저 검사는 다음 항목과 구분한다.
- `npm.cmd run test:browser:appearance`: 데스크톱 1280×900, 모바일 390×844에서 로비·생성/코드 Dialog·다섯 SEED 탭·입력창/하단 메뉴 경계·패널 확대/닫기·초안 보존·설정 focus trap/Canvas 복귀와 중립 배경 검사 통과. 실제 화면을 outputs/seed-*.png로 저장했다.
- `npm.cmd run test:browser:exhibition`: 두 게임의 데스크톱/모바일 포탈 도보 이동·복귀, 부스 E/버튼, 공식 이미지·트레일러 URL·SNS 상태·링크, 게임 입력 잠금·스크롤 후 닫기 버튼·포커스 복귀·모바일 영상 영역 분리 통과. 브라우저 실행 예외 없음.
- `npm.cmd run test:browser:community`: 공개 생성/목록/초대 입장, 좌석/공동 성장/잠긴 선택, 개인 숨김, 상태·채팅 초안/읽던 위치, RTC 채팅, 개인 소리/공유 재생, SEED slider 키보드 입력, 필드/YouTube Document PIP, 모바일 조작 가림·작은 viewport·Escape/Enter, 방장 퇴장, 확정 방 종료 시 1회 새로고침·죽은 초대 제거까지 **전체 통과**. 브라우저 실행 예외 없음.
- `npm.cmd run test:network`: **16인 실제 루프백 WebRTC 검사 통과**. 손실/재정렬/지연 복구, 맵/좌석/장난감/연쇄/공/불 성장, 정상 방장 퇴장·강제 종료·게임 데이터 단절·스케줄러 지연에서 승계를 확인했다. 최종 epoch 5, 검사 HTTP 요청 1602회. 실인터넷 성능 수치가 아니다.
- 검증 과정에서 닫힌 BottomSheet의 가림, SEED 입력 높이 고정과 패널 확대 충돌, 긴 탭의 부모 높이 확장, 작은 viewport, 소개창 닫기 버튼 스크롤, 모바일 라디오와 필드 조작 겹침을 수정했다. 구 UI의 숨겨진 탭 직접 클릭·native select·정확한 이전 픽셀 폭에 의존한 검사도 현재 사용자 조작에 맞게 바꿨다.
- 비교 자료: `web/outputs/seed-rebuild-review.html`에 이전/새 로비·방 화면과 모바일, 실제 SEED 적용 목록을 정리했다. 실행 로그는 `web/outputs/redesign-{unit,render,appearance,community,exhibition,network}.log`다. 산출물 폴더는 Git에서 제외된다.
- 한계: 로컬 Worker/SQLite·모의 Discord/YouTube와 격리 headless Chromium, Node 루프백 RTC 결과다. 개인 브라우저/데스크톱 UI는 조작하지 않았다. 실제 OAuth 동의·YouTube 스트리밍·실물 모바일 키보드/터치·다른 브라우저·인터넷 NAT·커뮤니티 선호는 검증하지 않았다. 공개 배포·커밋·푸시는 하지 않았다.

## 2026-11-05 SEED 흑백 UI·게임 필드 후속 공개 배포 (버전 25, 규약 v16 유지)

- 사용자 후속 **“배포해줘”** 요청에 따라 앞서 검증한 INT-14 변경을 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 공개했다. 사전/사후 `get_site`에서 기존 public 접근과 같은 URL을 확인했다. DB·런타임 설정·접근 정책을 변경하지 않았으며 환경 리비전 **1**을 유지했다.
- 공식 Sites `build-site.mjs`로 최신 소스를 다시 빌드했다. `outputs/prepare-seed-deploy.mjs`로 SEED 소스를 포함한 런타임 입력 **183개**가 빌드보다 오래됐음을 확인하고, 원본 작업을 유지한 게시 전용 `outputs/site-source`에 소스 **228개**와 빌드 파일 **110개**를 복사·SHA-256 대조했다. 로컬 상태와 비밀값은 제외했다.
- 공식 source helper로 게시 전용 소스를 동기화하고 패키징했다. 게시 소스 커밋은 `837fd7c0607ebea2158af9215f6de7ce0ec3b447`, 압축 파일은 `web/outputs/huddlers-fire-seed-deploy.tar.gz`, SHA-256은 `64dc99d2dc960d1dd8b6e5832a53b8b9885b4a9354d404e464f2bf4676979a57`이다. 원본 GitHub 저장소의 미커밋 상태를 유지했다. 인증값은 메모리와 숨겨진 stdin만 사용했고 전역 설정은 변경하지 않았다.
- 저장 버전 `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_588fae56dd3c8191881ffcd16afe4013`, 사용자 버전 **25**. 배포 `appgdep_6aec3895bce881919b2997f0184e4bc7`의 최종 상태 **succeeded**, URL: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- `node outputs/check-seed-deployment.mjs 25` 통과. 공개 HTML과 방 목록 HTTP 200, 서버 렌더의 SEED dark-only 속성, JS/CSS·아이콘·게임/소리 자산 **36개** 및 타이머 Worker **1개**의 빌드 해시 일치를 확인했다. 흑백 테마·포탈 표식·불 외형·SEED 컴포넌트·전시장 콘텐츠가 공개 번들에 있으며 Discord 준비 상태와 미인증 방 생성 HTTP 401도 유지된다. 결과는 `web/outputs/seed-deployment-check.json`이다. 공개 사용자 세션이나 방은 만들지 않았다.
- 이번 공개 확인은 파일/API 검사이며 실제 Discord 동의·YouTube 스트리밍·실기기/NAT 검증을 추가로 주장하지 않는다. 기존 참가자는 새로고침 후 새 UI를 사용한다.

## 2026-11-05 SEED Design 설치·전체 UI/게임 필드 흑백 재구성 (INT-14, 로컬)

- 사용자 계획 승인과 적용 범위 답변 “UI와 게임 필드에 적용”에 따라 구현했다. 외부 사진·게임 이미지·영상은 원색으로 두고 앱 UI와 직접 그리는 Canvas 색을 무채색으로 변경했다. 기존 미커밋 작업 위에 변경했으며 전역 규칙·설정, 공유 물리·네트워크 코드·DB 구조·통신 규약 v16은 이번 변경으로 바꾸지 않았다. 공개 배포·커밋은 수행하지 않았다.
- 공식 npm 패키지 설치 확인: `@seed-design/react@3.1.1`, `@seed-design/css@3.1.0`, `@seed-design/tailwind4-theme@3.1.0`, `@seed-design/vite-plugin@2.1.1`. 설치와 캐시는 프로젝트 내부에 한정했다. RSC/TSX 로컬 설정, 고정 dark-only 테마, SEED ActionButton/TextField/Slider/Switch/Dialog/Portal을 실제 화면에 연결했다.
- `npm.cmd run typecheck`, `npm.cmd run build` 통과. Vinext/Vite 8 + Cloudflare Worker 빌드 완료. 새 공통 컨트롤·팝업·외형 모듈과 외형 검사 파일 대상 ESLint 통과, `git diff --check` 통과.
- `npm.cmd test`: **179개 통과**. 기존 두 색상 고정 검사를 새 흑백 피부·전경 위 이름표 합성 기준으로 갱신했다. 새 검사는 세 맵×다섯 불 외형의 실제 Canvas 픽셀에서 무채색 여부, 다섯 외형의 차이, 이전 유색 프로필 변환의 alpha 보존, 원본 플레이어 불변성을 확인한다.
- `npm.cmd run test:render` 통과. 데스크톱·모바일·PIP 크기의 맵·캐릭터·포탈·부스·겹친 이름표·불 외형을 Canvas에서 직접 렌더하고 PNG를 확인했다. 프로필/부스 이미지 원색은 유지한다. 전체 Canvas 필터는 사용하지 않는다.
- 로컬 빌드 Worker `127.0.0.1:5191`과 실제 앱 API/SQLite·외부 Discord fixture `127.0.0.1:5192`로 격리 headless Chromium 검증을 수행했다. 개인 브라우저·데스크톱 UI는 사용하지 않았다. 제한된 실행의 Chromium CDP 응답 및 esbuild 디렉터리 접근 제한은 필요한 로컬 테스트 명령만 확장 실행해 해소했다.
- `CAMP_TEST_URL=http://127.0.0.1:5192 npm.cmd run test:browser:community` 통과. SEED slider Home/End/방향키 조작, 지연 음원 로딩 중 개인 음량 저장·최신 값 적용·실제 loop 음소거, 설정/라디오 값 동기화, 좌석·공동 성장·포탈 이동, 다른 참가자와 채팅/라디오 유지, 초안·스크롤 복원, Document PIP 이동·복귀, 모바일 200×200 영상·음소거 버튼, 방 종료 후 1회 새로고침을 확인했다. 브라우저 실행 예외 없음.
- 같은 로컬 주소에서 `npm.cmd run test:browser:exhibition` 통과. PARRUITS!/Torizon Telecom 양쪽 모두 데스크톱·모바일의 포탈 왕복·부스 E/터치·원본 이미지·트레일러·SNS·링크·본문 스크롤·게임 입력 차단·닫기·Canvas 포커스 복귀와 공용 재생/개인 음소거 불변을 확인했다. 모바일 소개창과 라디오 영상이 겹치지 않는다. 브라우저 실행 예외 없음.
- `npm.cmd run test:browser:appearance`에 해당하는 `node tests/browser.appearance.mjs` 통과. 데스크톱/모바일의 읽을 수 있는 탭 폭, 화면 범위, 설정 팝업 쌓임·닫기 버튼 클릭 가능 여부, 중립 배경과 포커스 복귀를 검사했다. `outputs/seed-lobby-*.png`, `seed-room-*.png`, `seed-settings-*.png`, `game-intro-*.png`와 `game-intro-links-*.png`를 확인했다.
- 검증 중 SEED 기본 flex/position 규칙과 기존 CSS 충돌로 생긴 탭 폭 축소·모바일 상호작용 버튼 가림·팝업 쌓임 및 소개창 영상 공간 문제를 실제 요소 경계·스크린샷으로 찾아 수정한 뒤 관련 검사를 재실행했다. 실제 Discord 사용자 동의·YouTube 스트리밍은 fixture로 대체했고 실인터넷 NAT·실기기 터치·커뮤니티 선호 검증을 주장하지 않는다.

## Discord 운영 활성화 (2026-11-03)

- 사용자가 로컬 비밀 설정에 등록한 두 값을 출력하지 않고 확인하여, Sites의 `DISCORD_CLIENT_ID`와 `DISCORD_CLIENT_SECRET`에 비밀 값으로 등록했다. 환경 설정 리비전은 **1**이다.
- 저장된 **버전 4**를 재배포하여 새 환경 설정을 적용했다. 결과 `succeeded`, 배포 ID `appgdep_6ae9b287324881918d0333c5ea9ef6ac`. 공개 주소는 https://huddlers-fire-camp.gywkd77.chatgpt.site 이다.
- 운영에서 `discordAvailable: true`, 등록된 앱 ID, `identify` 단일 권한, 운영 콜백 주소, 일회용 인증 상태 및 취소 후 완료 페이지 복귀를 확인했다.
- 홈 및 18개 JS/CSS 자산의 해시가 검증된 빌드와 일치했다. HTML·브라우저 자산·세션 응답에 Client Secret이 노출되지 않음을 확인했다.
- 세션·D1 방 생성·참가·종료를 확인하고 임시 방을 종료했다. 실제 Discord 계정 동의와 사진 수신은 사용자의 브라우저에서 마지막 확인이 필요하다.

## 라디오 지속 재생·설정·Discord 연결 검증 (2026-11-03)

- Sites **버전 4 배포 성공**: https://huddlers-fire-camp.gywkd77.chatgpt.site. 기존 공개 접근 설정과 D1 스키마·런타임 환경 변수를 유지했다.
- 배포 소스: `4bc1fe22db662136870eec6d8c9bc473fd2d96e3`. 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_9455d53517e88191835b3ea3e273bfc9`. 배포: `appgdep_6ae99b7b8aac819195e23f9fde56a9ab`.
- 운영 HTTP 확인: 홈과 **18개 JS/CSS 자산**의 SHA-256이 검증된 빌드와 일치했다. Discord 완료 페이지와 미설정 제공자 안내, 세션·D1 방 생성·참가를 확인하고 임시 방을 종료했다.
- 라디오 팝업과 단일 YouTube 플레이어 수명을 분리했다. 팝업을 닫아도 화면 한쪽의 플레이어가 유지되며, 라디오 말풍선에 현재 곡 제목·신청자·재생/일시정지 상태가 표시된다.
- 설정 팝업에 모닥불/음악 음량, 개인 듣기, 들어올리기 허용, Discord 프로필 연결을 모았다. 브라우저 저장값은 SSR에서 기본값으로 렌더한 뒤 동기화하며, 들어올리기 허용은 입장 시 신뢰성 있는 핸드셰이크에서 복원한다.
- Discord는 별도 인증 창과 완료 페이지를 사용한다. 원본 창·출처를 검증하고, 연결/해제 결과를 현재 방 멤버 사진에 반영한다. 취소·만료·통신 오류를 처리하며 원래 방장 탭을 유지한다.
- API/게임/재생/설정 테스트 **40/40**, 타입 검사 통과. 변경 소스 린트 오류 0, 기존 경고 3개. Canvas 렌더 7개 장면 통과, PC/모바일 라디오 곡 말풍선 이미지 확인.
- **16명 실제 로컬 WebRTC 검사 통과**, HTTP 요청 425회. 추가 검증: 저장된 들기 거부 설정 복원/변경, 곡 제목의 전원 전파 및 재접속 복원.
- 실제 브라우저 팝업 조작·YouTube 소리·Discord 실제 계정 동의는 미검증이다. Discord 개발자 앱과 운영 자격증명이 아직 없으므로 실제 계정 연결은 [설정 안내](discord-setup.md)의 앱 생성 및 비밀 값 등록 후 완료해야 한다.
- 프로토콜 v4로 갱신했으므로 모든 참가자는 새로고침 후 입장해야 한다.

## 채팅·라디오·던지기 배포 (2026-11-03)

- 배포 URL: https://huddlers-fire-camp.gywkd77.chatgpt.site
- Sites 버전: **3**, 배포 결과 `succeeded`.
- 배포 소스 커밋: `9eadff4879f736ef549e6eb5eb24278e17a6d4e2`.
- 저장 버전 ID: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_c18bd6fc30548191909373f9c70be154`.
- 배포 ID: `appgdep_6ae994ec6554819198f90181342b55d8`.
- 최신순 채팅·말풍선 겹침 보정, 라디오 오브젝트의 R키/터치 팝업, 친구 던지기와 궤적 동기화를 반영했다. 기존 공개 접근 설정, 런타임 환경 변수와 D1 스키마를 유지했다.
- API·기능 테스트 **32/32**, 타입 검사, 빌드, 렌더 7개 장면, 16명 로컬 WebRTC 통합 검사 통과. 린트 오류 0, 기존 경고 4개. WebRTC 검사에는 던지는 사람·던져진 사람·호스트의 비행 및 착지 상태와 재접속 복구가 포함된다.
- 실제 공개 배포 HTTP에서 홈 및 **17개 JS/CSS 자산의 SHA-256이 검증된 로컬 빌드와 일치**함을 확인했다. 별도 세션으로 D1 방 생성·참가·종료를 검증하고 임시 방을 종료했다.
- 실제 브라우저 팝업 조작·YouTube 실재생·인터넷 NAT 통과는 수동 확인 항목이다. 프로토콜 v3 적용으로 모든 참가자는 새로고침 후 입장해야 한다.

## 기능 확장 배포 (2026-11-03)

- 배포 URL: https://huddlers-fire-camp.gywkd77.chatgpt.site
- Sites 버전: **2**, 배포 결과 `succeeded`.
- 배포 소스 커밋: `117ee9953603daf0f8181187d39a245b9af078ea`.
- 저장 버전 ID: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_3a8230d1edc08191be2964752320ca9d`.
- 배포 ID: `appgdep_6ae98e9c03b481918837052e02344c88`.
- 배포 직전 기존 접근 설정이 공개임을 확인했고, 해당 설정을 유지했다. 런타임 환경 변수와 D1 스키마 변경은 없다.
- 배포 직전 API·기능 테스트 25개를 재실행하여 모두 통과했다. 기존에 통과한 최종 Worker/클라이언트 빌드를 동일한 소스 스냅샷과 함께 패키징했다.
- 실제 배포 HTTP에서 홈·연결 자산과 로컬 빌드의 SHA-256 일치, 게스트 세션 생성/조회, D1 방 생성/조회/종료를 확인했다. 검사에 사용한 임시 방은 종료했다.
- 이 검사는 실제 배포 Worker와 D1의 동작을 확인한다. 브라우저 UI·YouTube 실재생·인터넷 WebRTC/NAT 검증을 대신하지 않는다.

## 승인된 기능 확장 검증

검증일: 2026-11-03. 기능 확장 후 최종 소스로 아래 검사를 수행했다. 데스크톱 앱이나 개인 브라우저 UI를 조작하지 않았다.

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| API·게임·소셜·음악 로직 | 25/25 통과 | 기존 10개 + 확장 15개, `npm test` |
| TypeScript | 통과 | `npm run typecheck` |
| 배포용 빌드 | 통과 | `npm run build`, Vinext/Cloudflare Worker·클라이언트·SSR 생성 |
| 변경 소스 ESLint | 오류 0, 경고 4 | 기존 Discord 이동·이미지 2곳·lantern 미사용 인자 경고 |
| Canvas 렌더 | 5개 통과 | 기존 데스크톱/모바일 + 전체 감정표현·웅크리기·들기·공중·추락·채팅의 데스크톱/모바일/모션 감소 장면 |
| 렌더 이미지 확인 | 확인 | 실제 Canvas 출력에서 트램펄린·들림·높이·추락·말풍선·감정표현 확인, 트램펄린 가림을 줄이도록 배치 조정 |
| 실제 로컬 WebRTC | 통과 | 독립 인증 세션 16개, 15개 연결의 이동·신뢰성 있는 명령 채널, 최종 실행 HTTP 요청 426회 |
| 전원 소셜 상태 전달 | 통과 | 웅크리기·해제·감정표현, 한글 채팅 작성자·단일 전달·전송 간격 제한 |
| 음악 권한·상태 | 통과 | 전원 신청·방장만 재생, 전원 곡/재생 상태 전달, 진행 위치 체크포인트 |
| 물리 동작 전달 | 통과 | 들기·상대의 탈출, 트램펄린 높이, 맵 밖 추락 상태 수신·복귀 |
| 재접속 | 통과 | 채팅·음악 복원, 채팅 중복 방지, 들고 있는 사람이 재접속할 때 상대 안전 해제 |
| 기존 연결 동작 | 통과 | 17번째 참가 거절, 재연결·ICE 갱신, 방장 종료 시 16명 종료 |
| 로컬 HTTP | 통과 | Vite 개발 서버 홈 200 및 연결된 JS/CSS 자산 1개 응답 |

추가 로직 검사는 고정 시간 간격으로 중력·반복 도약·낙사 후 복귀·들기와 도약/추락 조합·중첩 금지·허용 해제·없는 운반자 복구를 검사한다. 프로토콜 검사는 작성자 위조·명령 중복·잘못된 입력과 영상 링크·대기열 정원/인당 제한·이전 곡 종료 이벤트·시계·전송 대기 처리를 포함한다. 200자의 한글 메시지 100개는 20개씩 나누어 브라우저의 메시지 크기 제한 안에서 복원하는 것도 검사했다.

이미지: `web/outputs/camp-desktop.png`, `camp-mobile.png`, `camp-actions.png`, `camp-actions-mobile.png`, `camp-actions-reduced.png`. Canvas만 렌더한 결과이며 React 전체 화면 캡처가 아니다.

### 확인 범위와 남은 항목

- WebRTC/HTTP 통합 검사는 `http://127.0.0.1:5173`의 Vite 개발 Worker에서 수행했다. Node Werift 루프백 통신이며 브라우저 엔진·인터넷 NAT 검사는 아니다.
- `npm start`로 빌드된 Worker를 직접 실행하는 검사는 현재 샌드박스에서 Wrangler/esbuild가 상위 디렉터리를 읽지 못해 시작에 실패했다. 빌드 자체는 통과했으며 이 실패를 배포용 Worker 실행 성공으로 기록하지 않는다.
- 실제 브라우저에서 한글 조합 Enter, 키보드/터치/포커스, 전체 레이아웃, 모닥불 소리와 YouTube 오디오를 확인해야 한다.
- YouTube 검사에서는 공유 제어 상태와 타임라인을 확인했다. 실제 영상은 재생하지 않았다. 자동재생 차단·광고·지역/연령/외부 재생 제한·플레이어 가시성·트랙 자동 종료는 실제 브라우저에서 별도로 확인해야 한다.
- 배포·호스팅 공개 범위·Discord/TURN 설정은 이번 기능 확장에서 변경하지 않았다. 기존 배포에는 이 확장을 반영하지 않았다.

## 1차 구현 검증

검증일: 2026-11-03. 검증 방식은 CLI, HTTP, Node WebRTC 및 Canvas 렌더러 직접 실행이다. 사용자 브라우저나 데스크톱 UI를 조작하는 검증은 수행하지 않았다.

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| API·게임 로직 자동 테스트 | 10/10 통과 | SQLite에 실제 API 쿼리 실행, 정원·권한·이탈·OAuth·충돌 |
| TypeScript | 통과 | `npm run typecheck` |
| 배포용 빌드 | 통과 | Vinext/Cloudflare Worker 및 정적 자산 생성 |
| 최종 빌드 HTTP 확인 | 통과 | 홈 HTML, 연결된 JS/CSS 6개, 세션 API |
| 비공개 배포 HTTP 확인 | 통과 | 실제 배포 HTML·JS/CSS 6개, 별도 세션 생성, 방 생성·참가·방장 퇴장 |
| Canvas 렌더링 | 통과 | 1050×824 / 390×520, 16인 / 1인 장면 생성·확인 |
| 실제 로컬 WebRTC 통합 | 통과 | 최종 빌드 Worker 대상, 독립 세션 16개, 15개 P2P DataChannel |
| 전체 상태 전달 | 통과 | 모든 참가자에게 16명 상태 수신 |
| 이동·앉기 | 통과 | 참가자 입력 → 방장 검증 → 다른 참가자 화면 상태 |
| 정원 초과 | 통과 | 17번째 참가를 HTTP 409로 거절 |
| 재접속 | 통과 | ICE 설정 갱신 → 새 채널 → 상태 전파 재개 |
| 방장 퇴장 | 통과 | 16개 클라이언트 모두 종료 감지 |

통신 통합 검사는 Werift의 ICE/DTLS/SCTP를 루프백 네트워크에서 사용했다. 모의 DataChannel 테스트가 아니지만, 브라우저 WebRTC 구현과 인터넷 NAT 환경을 검증한 것은 아니다.

비공개 배포: https://huddlers-fire-camp.gywkd77.chatgpt.site. 배포 원본 커밋은 `b0f8f21ba371b65814d91c550fbf415e4511c6b7`이다. Sites가 배포 성공을 확인했으며, 배포된 서버의 D1 세션·로비 동작도 HTTP로 검증했다. 접근 범위는 소유자 전용으로 유지했다.

## 점프 달리기와 플레이어 정보 검증

2026년 11월 3일 구현 기준이다. 통신 규약은 v5이며 함께 접속한 참가자는 모두 새로고침해야 한다.

- 단위·API·게임 로직 테스트 52개 통과. 달리기 배율·입력 정규화·멈춤·웅크리기 우선순위, 점프 준비·공중 재점프 방지·착지·친구와 함께 점프·탈출을 포함한다.
- 플레이어 선택은 DPR 2, 데스크톱·모바일 크기, 페이지 오프셋, 공중 높이·앉은 자세, 앞쪽 플레이어 우선, 이름표와 터치 여유 영역을 검사했다.
- 플레이어 정보는 현재 동작·연결 상태를 반영하고 내부 세션 필드를 반환하지 않는지 검사했다. 창을 열면 이동 입력을 초기화하며 대상이 퇴장하면 닫도록 구현했다.
- 최종 Worker 빌드 대상 16개 독립 세션·15개 실제 루프백 WebRTC 연결에서 달리기·해제·점프·착지 동기화를 확인했다. 기존 던지기·운반·탈출·트램펄린·추락·재접속·방장 퇴장 검사도 통과했다.
- 타입 검사·빌드 통과. 변경 코드 ESLint 오류 0개이며 외부 프로필 이미지 관련 경고와 기존 미사용 매개변수 경고가 남는다.
- Canvas 게임 장면과 `web/outputs/character-movement.png`를 렌더링해 확인했다. 브라우저 UI·터치 실기기·실제 인터넷 NAT 환경은 확인하지 않았다.
- 공개 사이트 버전 6 배포 성공. 소스 커밋은 `b5ac07ac52a26c9d57c80913e96461d800753964`이다. 공개 HTML이 현재 캐릭터·정보창 번들을 참조하며 JS/CSS 18개의 SHA-256이 검증한 로컬 빌드와 일치한다. 로비 API 응답과 기존 Discord 설정 활성 상태를 확인했다.

## 총·눈뭉치·폭탄 검증

2026년 11월 3일 구현. 통신 규약 v6이며 참가자 모두 새로고침해야 한다.

- 단위·API·게임 로직 60개 통과. 무기 선택·공유 재사용 대기시간·잘못된 방향 차단·빠른 탄환 충돌·점프 높이·장애물·눈뭉치 포물선·폭탄 단일 폭발·자기 밀림·운반 해제·추락 복귀·중복 명령 방지·스냅샷 용량을 검사했다.
- 16개 독립 세션과 15개 실제 루프백 WebRTC 연결에서 무기 선택, 총 피격에 따른 밀림, 폭탄 투사체와 지연 폭발이 다른 참가자에게 전달됐다. 기존 이동·점프·운반·트램펄린·추락·재접속·방장 퇴장도 통과했다.
- 실제 Canvas 렌더러로 `web/outputs/character-weapons.png`, `camp-weapons.png`, `camp-weapons-mobile.png`, `camp-weapons-reduced.png`를 생성하고 무기 든 자세·발사·투사체·폭발 범위·피격과 모션 감소 표현을 확인했다.
- 체력·사망·점수 없이 밀려나는 장난 방식이다. 1 총 / 2 눈뭉치 / 3 폭탄 / 0 맨손, J 또는 우클릭으로 사용한다. 모바일은 마지막 이동 방향으로 사용 버튼을 누른다. 왼쪽 클릭과 터치는 기존 플레이어 정보를 연다.
- 브라우저 UI·우클릭 및 키보드 포커스 상호작용·터치 실기기·실제 인터넷 NAT 환경은 자동 검사 범위에 포함하지 않았다.
- TypeScript와 최종 배포 빌드 통과. 변경 코드 ESLint 오류 0개이며 기존 외부 이미지 2개와 미사용 매개변수 1개 경고가 남는다.
- 공개 사이트 버전 7 배포 성공: https://huddlers-fire-camp.gywkd77.chatgpt.site. 소스 커밋 `37b90c9bb617fd0775f829dbd1ee10b1c2855cb8`. 배포된 HTML과 JS/CSS 18개의 SHA-256이 검증한 로컬 빌드와 일치하며, 무기 선택·투사체·효과·재사용 대기시간 코드 및 로비 API·Discord 설정 활성 상태를 확인했다.

## 연쇄 들기·공중 잡기·방장 자동 승계·입장 화면

2026년 11월 3일 구현. 통신 규약 v7이며 기존 참가자는 모두 새로고침해야 한다.

- 단위·API·게임 로직 73개 통과. 최대 16명 연쇄와 순서에 독립적인 위치 갱신, 중간 탈출·부분 던지기·동의 해제·퇴장 정리, 공중 잡기의 높이·거리·동의·중복 잡기·순환 방지를 확인했다.
- 서버는 입장 순서로 활성 후임을 선정하며 최신 상태를 받은 참가자를 우선한다. 방장 퇴장은 즉시, 비정상 종료는 20초 임대 만료 후 승계한다. 새 방장 연결 실패 때 다음 임대 만료에 후임을 다시 선정한다. 동시 요청의 단일 선정, 이전 방장의 갱신·시그널 거부, 빈 방 삭제, 같은 사용자의 새 방 생성 때 기존 방 보존을 API 테스트로 확인했다.
- 복구는 마지막 수신 원본 상태와 신뢰 채널 체크포인트를 이용한다. 새 방장이 연결을 재구성하는 동안 캠프 시간을 동결해 폭탄·재사용 대기시간 등이 대기 시간만큼 소진되지 않는지 검사했다. 중단된 명령은 재전송하지 않으며 이전 변경 번호의 상태·명령은 무시한다. 한 명만 남은 경우와 여러 비활성 이전 방장이 남은 경우에도 진행 가능한지 확인했다.
- Canvas 직접 실행으로 데스크톱·모바일 6명 연쇄, 데스크톱 16명 연쇄를 렌더링했다. 모든 머리가 화면 안에 있고 각각 선택 가능하며, 다른 사람의 이름표가 프로필 사진을 덮지 않는지 검사했다. 결과는 `web/outputs/camp-chain.png`, `camp-chain-mobile.png`, `camp-chain-16.png`에 있다.
- 입장 탭을 없애고 방 만들기와 코드 참가 폼을 함께 표시했다. 좁은 화면은 두 영역을 세로로 표시하며 코드 입력의 대비·글자 크기를 높였다. 타입 검사와 최종 Worker 빌드를 통과했다.
- 최종 빌드 대상 16개 독립 세션·15개 실제 루프백 WebRTC 연결에서 3명 연쇄·중간 탈출·던지기·공중 잡기 전달을 확인했다. 정상 방장 퇴장 후 첫 참가자에게 14개 연결이, 후임 강제 종료 후 그다음 참가자에게 13개 연결이 복원됐다. 기존 참가 코드·들기 관계·채팅·음악과 새 방장의 음악 권한을 검사했다. 최종 실행은 HTTP 967회로 완료했다.
- 로컬 첫 HTML 응답에 방 생성·코드 참가·코드 입력이 함께 있고 입장 탭이 없는지 확인했다.
- 공개 사이트 버전 8 배포 성공: https://huddlers-fire-camp.gywkd77.chatgpt.site. 소스 커밋 `aef2119b5344489260a9473aeea871f4d1df2369`. 공개 HTML과 JS/CSS 18개의 SHA-256이 검증한 빌드와 일치했다. 최초 화면의 두 입장 영역·코드 입력, 무기·승계 코드, 로비 API·Discord 설정을 확인했다. 공개 서버에서도 별도 두 세션으로 방 생성·참가·방장 퇴장 후 동일 코드의 새 방장·변경 번호 2를 확인하고 검사 방을 정리했다.
- DB 스키마는 기존 SQL을 변경하지 않고 `web/drizzle/0001_magical_lucky_pierre.sql`로 확장했다. 로컬 DB 열을 먼저 확인한 뒤 새 마이그레이션만 한 번 적용했다.
- 브라우저 UI·실기기 터치·인터넷 NAT 검증은 수행하지 않았다. 갑작스러운 방장 종료에서 최종 수신 상태 이후의 변화는 소실될 수 있고, 재접속에는 WebRTC 협상 시간이 추가된다. 모든 참가자가 종료하면 복구 상태도 사라진다.

## 구조 분리·승계 건강 판단·상태 계약 검증

2026-11-03. 통신 규약 v8이며 전원 새로고침이 필요하다.

- 단위·API·게임 로직·격리 입력 검사 88개 통과. 기존 73개에 RTC 수신 확인, 오래된 복구 후보 제외, 공동 장애 대기, 후보 부재 시 대기, 무확인 승계 순환 제한과 마지막 생존자 예외, 상태 계약과 연쇄 그래프 검증, 중복 전송 억제, 입력 잠금·포커스·이벤트 정리, 음악 동결·새 방장의 낮은 음악 revision 복구 검사를 추가했다.
- 타입 검사 통과. 공통 모델·스냅샷·명령 검증·중복 방지·입력·방장 건강 판단에 TypeScript/JSDoc 타입 검사를 적용했다. 기존 모든 JavaScript 구현의 타입 전환을 완료한 것은 아니다.
- 실제 로컬 Worker와 16개 독립 세션·15개 루프백 WebRTC 연결에서 개별 참가자의 게임 프레임 차단, 정상 방장 퇴장, 후임 강제 종료, HTTP 및 채널 연결을 유지한 채 모든 게임 프레임을 차단하는 경우를 검사했다. 개별 장애는 방장을 바꾸지 않았고 전체 게임 수신 확인 단절은 변경 번호 4의 후임으로 승계했다. 이전 방장은 자신의 HTTP 세션을 유지하며 참가자로 재접속했다. 최종 성공 실행은 HTTP 1,272회였다.
- 이동·달리기·점프·감정표현·채팅·음악·무기·연쇄·공중 잡기·탈출·던지기·추락·재접속의 기존 네트워크 검사를 함께 통과했다. Canvas 직접 렌더 장면도 기존 결과를 유지했다.
- `npm run test:metrics` 재현 시나리오: 16명 대기 JSON 8,912→8,008바이트(약 10.1% 감소), 10초 15Hz 대기 호출의 프레임 150→11개, 정리 주기 사이 일반 참가자 조회 SQL 12→6개. 실제 인터넷 처리량·호스팅 비용 측정이 아니며 움직임·새 복구 보고·정리 작업에는 추가 전송/SQL이 필요하다.
- 기존 SQL을 변경하지 않고 `0002_wild_rogue.sql`을 생성했다. 로컬 DB의 열을 확인한 뒤 새 마이그레이션만 한 번 적용했다. 최상위 README는 상세 실행 안내를 `web/README.md`로 연결하며 새 DB에는 0000·0001·0002 순서가 명시돼 있다.
- 게임 시각과 실제 시각을 분리하고, 복구 상태는 채팅·음악과 일치하는 체크포인트를 기준으로 한다. 이전 변경 번호의 메시지는 복구 상태를 바꾸지 않는다. 서버는 게임 상태 전체를 저장하지 않으므로 전원 종료 시 복구할 수 없으며, 마지막 확인 이후의 변화가 소실될 수 있다.
- 공개 사이트 버전 9 배포 성공. 소스 커밋 `d9fa45d2d68b3aeb665cf1174ed9529fd73e5932`. 공개 HTML 및 JS/CSS 18개의 SHA-256이 최종 로컬 빌드와 일치했다. 기존 이동·무기·입장 화면과 새 수신 확인·복구 코드, 로비 API·Discord 설정을 확인했다. 별도 검사 세션으로 정상 승계와 동일 코드 유지, 먼저 입장한 낡은 복구 후보 제외 및 최신 후보 선정, 이전 변경 번호의 시그널 HTTP 409 거절을 공개 서버에서 검증하고 검사 방을 정리했다.

## 제품 기준·하네스·로컬 스킬 정리 (2026-11-04)

- 사용자 답변인 네 장면 모두의 지원과 휴식/놀이 공간 구분 원칙을 `docs/product-direction.md`에 반영했다. 구역 기능은 미구현, 공간 연결 방식과 경계 규칙은 미정으로 구분했다.
- 자체 앱의 주요 모듈과 입장·휴식·놀이·음악·복구·퇴장 흐름을 소스와 관련 테스트로 대조하고 `docs/product-review.md`에 근거·영향·후속 결정을 남겼다. 모든 소스 줄의 정밀 감사나 실제 사용자 플레이 검사는 아니다. 방장 퇴장 확인창의 오래된 종료 안내는 후속 수정 항목이며 이번에 게임 코드를 바꾸지 않았다.
- `AGENTS.md`에 제품 기준과 작업별 스킬 선택을 연결했다. `plan-interview`는 관련 제품 계획에서 기존 답을 참조하도록 보완했다. `camp-product-review`, `camp-change-validation`을 프로젝트 내부에 추가했다. 초기 계획은 현재 규칙과 구분하도록 표시했다. 전역 설정·공통 스킬은 변경하지 않았다.
- 세 스킬의 YAML 앞부분·이름·설명·허용 필드·미완성 틀 부재, 새 스킬 두 개의 UI 메타데이터를 기존 `js-yaml` 파서와 Node 검사로 확인했다. 번들 Python 검증기의 의존성인 PyYAML이 로컬 Python에 없어 해당 검증기는 실행하지 않았다. 패키지를 전역 설치하지 않고 대체 검사를 사용했다.
- 최종 문서·스킬 9개의 로컬 참조 경로 44개가 존재하는 것과 UTF-8 대체 문자 부재를 확인했다. `git diff --check` 통과.
- 다음 적용 사례를 문서 대조 방식으로 점검했다. 일반 버그 수정에는 의도 인터뷰를 강제하지 않음, 구역 계획에서는 미정인 경계 사례를 확정으로 만들지 않음, 승인된 놀이를 임의로 제거하지 않음, 계획만 요청받으면 기록 파일도 수정하지 않음, 배포 요청에는 기존 승인을 재요구하지 않음, 기술 검증을 커뮤니티 경험 확인으로 보고하지 않음. 독립 에이전트 실행을 통한 행동 검증은 아니다.
- 이번 변경은 문서·규칙·스킬에 한정한다. 게임 테스트·타입 검사·빌드·네트워크 검사를 재실행하거나 게임을 재배포하지 않았다. 앞 절의 통과·배포 결과는 이전 구현 작업의 기록이다.

## P2P 전송 개선 후보의 오프라인 비교 (2026-11-04)

- `node web/tests/measure-p2p.mjs`로 16명·30초·15Hz의 여섯 시나리오를 실행했다. 실제 시뮬레이션·일반 상태 발행과 무기 명령의 즉시 신뢰 상태 발행을 포함했다. 게임의 런타임 통신 코드는 변경하지 않았다.
- 변경분 JSON과 전체 상태의 필드 순서 배열을 조합한 시제품은 이동 입력 조건에서 85.6~94.1%, 무기 조건에서 60.3~85.3%, 전원 대기에서 62.4% 적은 상태 배포 데이터를 생성했다. 시제품의 모든 전체 신뢰 상태 내용·발행 횟수는 유지했다. 현재 방식의 16명 무기 조건에서 전체 신뢰 상태는 30초 316회였다.
- 변경분 재구성 1,937회, 전체 경량 상태 재구성, 한글·이모지·멤버 추가/삭제·잘못된 기준 순번을 확인했다. 일반 패킷 일부 제외 후의 독립 재구성도 확인했으나 실제 회선의 손실·지연 검사로 해석하지 않는다.
- 초기 비교에서 제외됐던 무기 명령별 신뢰 발행을 최종 비교에 반영했다. 최종 수치는 [P2P 비교 보고서](p2p-network-benchmark.md)에 기록했다. 데이터량은 소켓 전달 전 페이로드 기준이며 실제 업로드·FPS·CPU 개선 수치가 아니다. 참가자 중계의 감소율은 구현 결과가 아닌 별도의 경로 수 계산이다.

## P2P 전송 v9 구현·검증·배포 (2026-11-04)

- 게임 판정과 전송은 방장 중심 WebRTC P2P를 유지했다. `camp-wire.mjs`에 전체 필드 순서 배열·체크포인트 기준 변경분·제한된 불변 기준 캐시를 추가했다. 수신자별 유효한 수신 확인을 기준으로 전송하고 동일 기준은 인코딩을 공유한다. 기준 유실 시 제한된 재동기화를 사용한다.
- 성공한 동작마다 전체 복구 상태를 보내던 경로를 다음 네트워크 틱의 신뢰 상태 알림으로 합쳤다. 명령 실행·중복 방지·성공/실패 응답은 유지하며 전체 체크포인트는 1Hz로 보낸다. 아직 전송하지 않은 상태 알림만 대체하고 필수 제어 메시지는 보존한다.
- 첫 RTC 회귀에서 방장 퇴장 직전 들기 상태가 마지막 복구 묶음에 반영되기 전에 연결이 닫히는 문제를 확인했다. 정상 퇴장에 최종 체크포인트 수신 확인 대기(최대 1.2초)를 추가했고 정상·강제 종료와 두 번의 후속 승계를 다시 통과했다. pagehide는 대기 없이 전송·beacon을 시도한다.
- `npm test` 99개 통과, TypeScript 검사와 최종 게시용 체크아웃 빌드 통과. 새로운 11개 검사는 변경분·전체 복원, 잘못된 필드·순번·epoch, 순서 뒤바뀜, 캐시 격리·만료·상한, 재동기화 제한, 신뢰 대기열과 정상 퇴장 수신 확인을 포함한다.
- 최종 `test:network`: 독립 세션 16개·실제 루프백 WebRTC 15개 연결, HTTP 1,386회. 일부 수신자에 일반 상태 20% 누락·순서 뒤바뀜·체크포인트 300ms 지연을 넣고 기준 캐시를 비워도 재동기화했으며 정상 방장은 유지됐다. 기존 이동·점프·무기·채팅·음악·16명 연쇄·공중 잡기·탈출·재접속·정상 승계·강제 종료·전체 게임 수신 확인 소실 검사를 통과했다.
- 로컬 장비 변경 명령→다른 참가자의 상태 반영을 30회 측정해 중앙값 23ms, 95백분위 52ms였다. 브라우저 렌더링이나 인터넷 회선 지연을 포함하지 않는다. 초기 방장 인코딩 475회에 누적 24.8ms를 기록했으나 이는 전체 게임 CPU 사용량이나 이전 대비 CPU 개선율이 아니다. 실제 DataChannel send 호출의 앱 바이트를 집계했으며 NIC·암호화 헤더·재전송 바이트와 구분했다.
- 적용 코드 모의 채널 비교: 전원 대기 61.9%, 16명 이동 입력 84.2%, 16명 무기 조건 78.2%의 상태 데이터 감소. 동작 명령별 발행도 실제 경로를 사용했다. `npm run test:metrics:p2p`로 재현하며 조건·제외 항목은 [비교 보고서](p2p-network-benchmark.md#v9-적용-코드-비교)에 명시했다. 기존 시제품과 적용 결과를 구분했다.
- 공개 사이트 버전 10 배포 성공. 소스 `20aa29d13d1adb4f1f2a0a18e48f7c8fd8e34277`, 배포 `appgdep_6aea0aae9b3c81918e1d2438a2f5a82c`. 공개 접근 설정과 DB 바인딩을 유지했고 새 DB 마이그레이션은 없다. 원본 저장소를 커밋하지 않고 별도 게시용 체크아웃을 사용했다.
- 배포 후 공개 HTML HTTP 200, JS/CSS 18개의 SHA-256과 게시용 빌드 일치, 새 P2P 코드 포함, Discord 설정 활성 응답과 검사 전용 두 세션의 동일 코드 방장 승계를 확인했다. 검사 방을 정리했다. 실제 Discord 인증·인터넷 WebRTC·물리 터치 기기의 검사를 의미하지 않는다. v8 참가자는 모두 새로고침해야 한다.

## 브라우저와 운영 환경에서 남은 확인

- Chrome/Edge/Firefox 등의 실제 브라우저에서 키보드 포커스, 레이아웃, 소리 재생과 이동 확인.
- 서로 다른 인터넷 회선 및 모바일/제한적인 NAT 환경에서 연결 확인. TURN 운영 설정 필요.
- 실제 Discord 애플리케이션 자격증명과 등록된 리디렉션 URL로 프로필 사진 조회 확인. 자동 테스트에서는 응답을 대체하여 상태 검증·취소·만료 처리를 검사했다.
- 커뮤니티 공개 시 호스팅 접근 범위와 운영 한도 결정.


## 공개방·작업 동석·PIP 구현 검증 (2026-11-04)

사용자가 공개방 목록을 추가한 계획의 구현·검증을 승인한 작업이다. 기존 작업 중 변경은 보존했으며 공개 배포·원격 DB 마이그레이션·커밋은 수행하지 않았다.

### 구현과 계약

- 공개방 목록, 공개/초대방 생성, 링크 방문 시 참가 화면, 실제 자동 승계에 맞는 퇴장 안내.
- 작업 메모·수동 상태, AFK 보호/장난 허용, 호출 수신 선택, 최근 100개 채팅·호출의 실제 날짜와 시간.
- 필드 보기, 75~300% 줌, 내 캐릭터 추적, 지원 환경의 Document PIP와 창 안의 참가자 정보·호출. 네트워크·음악은 원래 페이지의 한 세션으로 유지.
- 앉기와 들기의 양쪽 판정, 들고 앉을 때 안전 해제, AFK 보호의 이동·공격·피격 차단, 주요 오브젝트 재배치와 캐릭터 가림 표현.
- 규약 v10: 작업 상태·호출 대기시간을 전체/변경분/복구에 포함. 작성 시각은 실제 시각, 시뮬레이션·호출 대기시간은 기존 캠프 시각을 사용. 이전 참가자는 함께 새로고침해야 함.

### 실행 결과

| 검사 | 결과·범위 |
| --- | --- |
| npm.cmd test | 112개 통과. 공개/초대 노출, 페이지 제한, 정원·만료, AFK 보호·연쇄·낙사 복귀, 호출 중복·수신 거부·승계 후 대기시간, 최대 길이 프레임, 줌 선택·조준·다른 창 렌더링 포함 |
| npm.cmd run typecheck | 통과 |
| npm.cmd run build | 최종 소스 빌드 통과. 실행 중인 로컬 Worker가 dist를 사용하는 동안 Windows 잠금으로 한 차례 실패했고, 전용 서버 종료 후 정상 빌드 |
| npm.cmd run test:render | 기존 장면과 추가 camp-presence, camp-pip, camp-zoom-mobile 장면 통과. Canvas 직접 렌더이며 전체 UI 캡처와 구분 |
| 대상 파일 ESLint | 오류 없음. 기존 img 사용과 미사용 변수 경고는 남음. 저장소 전체 lint 결과로 확대하지 않음 |
| node tests/browser.community.mjs | 격리된 임시 프로필의 헤드리스 Chrome에서 공개방 생성·목록 클릭 참가·링크 참가·상태/메모·채팅 시각·필드 보기·줌·모바일 폭·퇴장·방 정리 통과. 실제 Document PIP 열기, 창 안의 키보드·줌·참가자 상세, 닫은 뒤 원래 방 복귀 통과. 런타임 예외 없음 |
| npm.cmd run test:network | 최종 16명·15개 실제 루프백 WebRTC 연결 통과, HTTP 1,409회. 상태/메모/AFK/호출 시각 복제, 과거 호출 재알림 방지, 정상 승계·강제 종료 승계·HTTP 정상 중 전체 게임 데이터 단절 승계까지 확인 |
| npm.cmd run test:metrics:p2p | 기존 모의 채널의 현행 코덱·확인·대기열 실행 통과. 실인터넷·NIC 전송량·CPU/FPS 개선 수치로 해석하지 않음 |
| git diff --check | 통과 |

### 발견하고 수정한 문제

1. 날짜·시간 계약 추가 후 기존 복구 테스트의 채팅 데이터에 실제 시각과 메시지 종류가 없던 부분을 갱신했다. 통나무 재배치에 맞춰 충돌 회귀의 시작 좌표도 갱신했다.
2. 루프백 장애 주입 직전에 SCTP에 들어간 체크포인트가 늦게 도착해 ‘완전 수신 단절’ 검사를 흔드는 경우를 확인했다. 해당 장애 구간에는 송신과 수신을 함께 차단해 의도한 장애를 재현한다.
3. 방장 승계 후 다른 참가자의 수신 확인으로 물리가 재개된 상태에서 데이터 채널이 제어 hello보다 먼저 열리면, 복구한 참가자를 끊김으로 표시해 들기 연쇄를 해제하는 경합을 확인했다. 데이터 채널 열기로 기존 복구 상태를 해제하지 않도록 수정하고 재현 회귀를 추가했다. 교체된 채널의 늦은 종료·메시지 콜백도 현재 연결에 적용되지 않게 했다. 수정 후 전체 루프백 검사 재통과.

### 환경과 남은 범위

- 새 SQL은 drizzle/0003_true_nextwave.sql 및 생성된 메타데이터로 관리한다. 기존 방의 공개 범위 기본값은 unlisted다. 새 별도 로컬 DB인 web/.wrangler/community-validation에 초기 SQL과 새 SQL을 각각 한 번 적용했다. 원격 DB와 기존 로컬 개발 DB에는 적용하지 않았다.
- 로컬 Worker는 127.0.0.1:5191에서 검사했고 종료했다. 네트워크 검사에서 만든 참가자는 해당 검사 자격으로 정리했다. 헤드리스 검사는 임시 프로필을 사용·종료하며 개인 브라우저와 데스크톱 UI를 조작하지 않았다.
- web/outputs/community-field-browser.png, community-mobile-browser.png는 실제 헤드리스 브라우저 캡처다. community-network-final.log는 최종 네트워크 결과다. outputs는 실행 산출물이다.
- OS의 실제 항상 위 표시·장시간 다른 앱 작업, 실물 모바일 터치·백그라운드·화면 잠금, 인터넷 NAT/TURN, 실제 Discord 인증과 커뮤니티 사용의 편안함은 이 검사가 보증하지 않는다.
- 음성 기능은 docs/voice-options.md에 공식 권한 조건과 대안을 검토했다. 현재 OAuth identify만으로 발화·음소거를 읽을 수 없으며, 자체 마이크 통화와 모바일 음성은 도입하지 않았다. 계획의 음성 단계는 기술 검토 범위다.
- 공개 사이트는 이전 배포 상태다. 릴리스하려면 새 DB 마이그레이션을 적용하고 v10 클라이언트로 함께 전환해야 한다.


## 공개방·작업 동석 버전 11 공개 배포 (2026-11-04)

사용자가 구현 완료 후 공개 배포 진행을 요청했다. 앞 절의 ‘공개 사이트는 이전 배포 상태’는 이 배포 전 기록이며, 현재는 버전 11이 공개 상태다.

- 기존 Sites 프로젝트 appgprj_6ae8e9ae42708191b253341387aa287f, 공개 접근 설정, DB 바인딩과 런타임 설정 리비전 1을 유지했다. 별도 사이트나 접근 설정을 만들지 않았다.
- 원본 저장소는 커밋하지 않았다. outputs/site-source의 기존 게시 전용 체크아웃을 공식 Sites source helper로 열고, 현재 web 소스 186개와 검증된 Worker/client 빌드를 일치시켰다. 비밀값·개발 DB·출력 파일을 소스에서 제외했다.
- 소스 커밋: 806ea4d6a9daaf4d725a5e4e5008e8e83733b1de. 저장 버전: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_5554af53ba648191ac9a4442f0676500 (사용자 버전 11).
- 배포: appgdep_6aea16651c608191a1ce34cc869561c6, 결과 succeeded. 주소: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- 패키지에 0003_true_nextwave.sql 및 Drizzle 메타데이터를 포함했다. Sites가 Worker 업로드 전에 호스팅 DB 마이그레이션을 적용했다. 배포 전 camp_rooms에 없던 title·visibility가 배포 후 존재하는 것을 읽기 전용 스키마 조회로 확인했다. 이미 적용한 SQL을 직접 재실행하지 않았다.
- 공개 HTML HTTP 200과 공개방 목록 화면, JS/CSS 18개의 SHA-256이 게시용 빌드와 일치함을 확인했다. 새 PIP·AFK·작성 시각 코드와 기존 Discord 설정 활성 상태를 확인했다.
- 운영 API에서 검증용 공개방을 생성해 목록 노출·참가·동일 코드의 방장 승계·승계 후 목록 유지를 확인했다. 초대방은 목록에 나타나지 않았고, 검증용 방들은 해당 검사 세션으로 정리했다. 다른 방이나 참가자를 수정하지 않았다.
- 검사: outputs/check-community-deployment.mjs, 결과 outputs/community-deployment-check.json. 로컬 구현 단계의 112개 검사·타입·빌드·16명 루프백·헤드리스 PIP 통과 결과를 재사용했으며, 이번 공개 확인을 실제 인터넷 WebRTC·실물 모바일·Discord 음성 검증으로 확대하지 않는다.
- 게시용 Git의 실행 계정 차이는 프로세스 범위의 단일 safe.directory 설정으로 처리했다. 전역 Git·Codex 설정은 변경하지 않았다. 소스 자격증명은 stdin과 세션 메모리로만 전달했다.

규약 v10으로 바뀌었으므로 이전 버전으로 열어 둔 참가자는 모두 새로고침해야 한다.

## 2026-11-04 축구공·작업 시간·백그라운드 개선 (규약 v11, 로컬 검증)

사용자가 승인한 계획과 YouTube 작은 창 선택을 구현했다. 축구공의 방장 물리·전송·복구, 채팅 오름차순과 읽기 위치 유지, 개인 작업 시간, 빠른 수동 상태 표시, Worker 실행 기회·지연 물리 보정·건강 기반 승계, 환경음 오디오 버퍼와 음악용 Document PIP가 이번 범위다. 기존 미커밋 변경을 보존했고 원본 저장소 커밋과 공개 배포는 하지 않았다.

### 실행 근거

- 작업 전 `npm.cmd test`: 기존 112개 통과. 변경 후 `npm.cmd test`: 123개 통과, 실패·건너뛰기 없음. 추가한 11개는 공의 접촉·감속·보호 대상 제외·장애물·장외 복귀, 전체/변경분 검증과 복구 복사, 작업 구간 누적, 1초 지연과 60개 정상 단계의 결과 일치, 장시간 정지의 캠프 시각 동결, 느린 방장의 갱신 거부, Worker/대체 타이머 중복 억제와 정리, 환경음 소스·재개를 검사한다.
- `npm.cmd run typecheck`: 통과. `npm.cmd run build`: Worker/client 빌드 통과. 빌드 도구의 동적 라우트 분류 안내는 남는다.
- `npm.cmd run lint`: 오류 0, 기존 이미지 요소와 미사용 변수 관련 경고 4개. 이번 추가 코드의 오류·의존성 경고는 해결했다.
- `npm.cmd run test:render`: 데스크톱·모바일·장난감·연쇄·프로필·상태/PIP 등 18개 Canvas 결과 통과. 축구공을 상태 장면에 포함했다. `web/outputs/camp-presence.png`를 직접 확인했다. Canvas 직접 렌더이며 실제 브라우저 스크린샷과 구분한다.
- 로컬 Worker `http://127.0.0.1:5191`에서 `CAMP_TEST_URL`을 지정하고 `npm.cmd run test:network`: 16명 실제 루프백 WebRTC 통합 통과. 걷기 접촉으로 공이 모든 참가자에게 전달되고, 확인된 공 체크포인트가 정상 방장 승계 뒤에도 유지됐다. 기존 손실·재접속·중복 명령·연쇄·폭탄·채팅/음악 검사에 더해, HTTP/RTC가 살아 있어도 지속 실행 지연을 표시한 방장의 임대가 갱신되지 않고 epoch 5의 정상 후임으로 복구되는 것을 확인했다. 최종 실행의 HTTP 요청은 1,578회다. 실인터넷/NAT·브라우저 FPS 검사가 아니다.
- `npm.cmd run test:browser:community`: 격리된 임시 헤드리스 Chromium 프로필에서 통과. 공개 목록/초대 참가, 실제 번들 Worker 2개 이상의 메시지 수신, 빠른 작업/자리 비움 선택과 시간 누적·정지, 채팅 날짜·오름차순, 별도 브라우저 게스트의 실제 RTC 메시지 도착 시 읽기 위치 유지·최신 이동, 필드 PIP 입력/복귀, 음악 PIP 문서 소유권·200px 이상 플레이어·닫기/복귀, 모바일 가로 넘침과 방 종료/정리를 검사했다. 런타임 예외 없음. `web/outputs/community-field-browser.png`, `community-mobile-browser.png`를 생성했고 모바일 결과를 직접 확인했다.
- 음악 브라우저 검사에서는 외부 YouTube API만 테스트용으로 대체했다. 주 문서의 `document.hidden`을 모의해도 표시된 PIP 문서의 플레이어가 정지하지 않는지 확인했다. 실제 YouTube 음원 재생·청취·광고·자동재생 승인 결과로 해석하지 않는다.
- `npm.cmd run test:metrics:p2p`: 모의 채널의 기존 전송량 기준 검사 통과. 대기·16명 이동·16명 무기의 기존 임계값을 충족했다. 스크립트 출력의 `productionV9BytesPerSecond`는 전송 경로의 과거 이름이며 이번 실행은 현재 v11 코드다. 실회선·CPU·FPS 개선율은 아니다.
- `git diff --check`: 검사 대상 변경의 공백 오류 없음.

### 실행 중 해결한 환경과 한계

초기 기본 로컬 DB에는 `camp_rooms.title`이 없어 방 생성 검사가 실패했다. 기본 DB에 SQL을 반복 적용하지 않고 새 `.wrangler/playground-validation` DB에 0000~0003을 순서대로 한 번 적용해 검증했다. 이번 기능에 새 DB 마이그레이션은 없다. 로컬 Worker와 격리된 Chrome의 샌드박스 접근 제한은 해당 검증 명령의 추가 권한 실행으로 해결했으며, 전역 Codex/Git 설정과 개인 브라우저를 바꾸지 않았다.

번들러가 `import.meta.url`을 빌드 머신의 `file:` URL로 치환해 Worker가 실패하는 경로를 발견했다. 정적 Worker 자산의 경로를 실행 사이트의 origin으로 복원하고, `text/javascript` 응답과 실제 브라우저 Worker 메시지 수신을 확인했다. Window 대체 타이머는 최근 Worker 메시지가 있을 때 중복 실행하지 않는다.

공유 상태는 규약 v11이다. 업데이트 시 모든 참가자가 함께 새로고침해야 한다. 실제 YouTube 청취, 장시간 실제 최소화, 기기 절전·모바일 백그라운드, 실인터넷 WebRTC와 커뮤니티 사용은 미검증이다. 운영체제나 브라우저가 모든 참가자를 중단시키면 계속 실행을 보장하지 않는다. 필드·음악 PIP는 한 창씩 번갈아 쓰며, 음악 창 이동 시 플레이어를 재생성하므로 무중단 음향은 보장하지 않는다. 공개 사이트는 이번 변경으로 배포하지 않았다.

## 2026-11-04 축구공·작업 시간·백그라운드 공개 배포 (버전 12)

이후 사용자의 ‘배포해줘’ 요청으로 위 로컬 검증 결과를 공개했다. 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`, 공개 접근 설정과 런타임 환경 리비전 1을 유지했다. 원본 저장소를 커밋하지 않고 공식 Sites source helper로 기존 `outputs/site-source` 게시 전용 체크아웃을 열었다.

- 소스 191개와 빌드 파일 91개의 SHA-256이 검증한 `web/` 결과와 일치함을 확인했다. 전역 설정·개인 브라우저를 변경하지 않았다. 인증은 stdin과 세션 메모리로만 전달했다.
- 게시 소스 커밋: `a8a8befa8199a39e85ad661cb1a82f8c2e6d1668`. 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_d3032fb39bbc8191882275596540d7ff` (사용자 버전 12).
- 아카이브: `outputs/huddlers-fire-playground-deploy.tar.gz`. 배포 전 빈 미리보기 임시 폴더를 제거하고 환경 파일·Git·의존성·로컬 런타임 상태가 제외됐음을 검사했다. Sites 저장 아티팩트는 소스 커밋과 일치하는 파일 91개다.
- 배포: `appgdep_6aea239308f4819183c403b684fc4244`, 결과 `succeeded`. 주소: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- DB 스키마·마이그레이션·바인딩은 이전 운영 버전과 같아 별도 SQL을 실행하지 않았다. 기존 마이그레이션을 수동으로 반복 적용하지 않았다.
- 공개 HTML HTTP 200, JS/CSS 18개와 타이머 Worker 1개의 SHA-256이 게시 빌드와 일치했다. Worker의 JavaScript MIME, 작업 시간·빠른 상태·채팅 최신 이동·축구공·YouTube 작은 창의 새 번들, 공개방 목록 API HTTP 200과 Discord 설정 활성 상태를 확인했다.
- 검사 스크립트: `outputs/check-playground-deployment.mjs`, 결과: `outputs/playground-deployment-check.json`. 공개 확인은 읽기 전용 HTTP 검사이며 다른 이용자의 방이나 메시지를 변경하지 않았다.
- 앞선 123개 검사·타입·빌드·Canvas·16명 RTC·격리된 브라우저 결과를 재사용했다. 이번 공개 확인을 실제 YouTube 청취·실인터넷 WebRTC·기기 절전 검증으로 확대하지 않는다.

통신 규약 v11이므로 이전 코드를 열어 둔 참가자는 모두 새로고침해야 한다.

## 2026-11-04 전체 프로젝트 피드백 검증

전체 피드백 요청으로 현재 작업 폴더를 검토했다. 기존 미커밋 작업을 보존했고 게임 코드·DB·배포 설정은 변경하지 않았다. 이번 새 실행과 기존 검증 자료를 구분한다.

- `web/`에서 `npm.cmd test`: 123개 통과, 실패·건너뛰기 없음.
- `npm.cmd run typecheck`: 통과.
- `npm.cmd run lint`: 오류 0, 경고 4개. `camp.tsx`와 `player-info-panel.tsx`의 이미지 요소 경고 각 1개, `camp-renderer.mjs`와 `camp-world.mjs`의 미사용 변수 경고 각 1개다.
- `git diff --check`: 공백 오류 없음. Git의 LF→CRLF 안내는 검사 실패와 구분한다.
- 기본 `.wrangler/state` D1 SQLite를 `DatabaseSync`의 `readOnly: true`로 열어 `PRAGMA table_info(camp_rooms)`만 조회했다. `title`·`visibility` 열이 없어 `web/README.md`의 마이그레이션 적용 완료 설명과 불일치한다. 사용자 행을 조회하거나 DB·SQL을 변경하지 않았다.
- 기존 `web/outputs/community-field-browser.png`, `community-mobile-browser.png`와 `camp-presence.png`를 직접 읽었다. 앞의 두 개는 이전 헤드리스 브라우저 결과이고 마지막은 이전 Canvas 직접 렌더 결과다. 이번에 새로 실행·생성한 화면 검사로 기록하지 않는다.
- 이번에는 build, 렌더 생성, 네트워크 통합, 헤드리스 브라우저 검사, 운영 사이트 조회·배포를 재실행하지 않았다. 실인터넷/NAT/TURN, 실제 YouTube 청취, 장시간 최소화·기기 절전·실물 터치와 커뮤니티 사용성은 여전히 별도 확인 범위다.

평가와 후속 제안은 [전체 프로젝트 피드백](product-review.md#전체-프로젝트-피드백-2026-11-04)에 기록했다. 제품 방향의 미정 사항을 새로 확정하지 않았다.

## 2026-11-04 보호 제거·화면·의도 하네스 검증 (규약 v12)

사용자가 **“보호 기능 제거 후 진행”**으로 구현·검증을 승인한 뒤 실행했다. 계획 전용 단계의 읽기와 이번 파일 변경을 구분한다. 기존 미커밋 작업을 유지했으며 공개방 관리·게임 소개 기능과 구역 설계는 추가하지 않았다.

### 변경과 실행 결과

- 보호 선택과 `afkProtected`를 기본값·타입·검증·고정 전송 필드에서 제거하고 이동·무기·들기·공 접촉의 상태 보호 분기를 제거했다. 고정 배열 위치가 바뀌어 규약을 v12로 올렸다. 들리기 동의·앉기·탈출·개인 듣기·호출 수신 선택은 유지한다.
- 대화·사람·내 상태·놀이 패널, 작은 화면/필드 보기 하단 메뉴, 접힌 초대, 짧은 상태 배지와 전체 메모 상세 표시를 구현했다. 패널 페이지는 마운트를 유지해 초안·대화 읽기 상태를 보존한다.
- `web/`의 `npm.cmd test`: **127개 통과**, 실패·건너뛰기 없음. 작업/자리 비움의 이동·점프·발사·피격·공 접촉, 상태 전환 중 연쇄·자세 보존, 개인 선택과 복귀, v11/잘못된 배열 거부, 전체·변경분·승계 계약을 검사했다. 렌더 배지 검사는 1·8·16명, 1050×824·390×520·560×480, 0.75·1·2·3배에서 프로필·몸·이름표·말풍선과의 겹침 및 배지 선택을 확인했다.
- `npm.cmd run typecheck`: 통과. `npm.cmd run lint`: 오류 0, 기존 경고 4개(이미지 요소 2, 미사용 변수 2). `npm.cmd run build`: 최종 화면 수정까지 통과. 빌드의 일부 라우트 분류 안내는 실패가 아니다.
- `npm.cmd run test:render`: Canvas 직접 렌더 18개 산출물 통과. `web/outputs/camp-presence.png`를 읽어 긴 메모가 필드에서 사라지고 짧은 배지가 표시되는 것을 확인했다. 이는 브라우저 화면 검사를 대신하지 않는다.
- 기존 격리 DB `.wrangler/playground-validation`의 `camp_rooms` 스키마에 `title`·`visibility`가 있음을 확인하고 로컬 Worker를 `127.0.0.1:5192`에서 실행했다. 기본 `.wrangler/state`와 운영 DB는 변경하지 않았고 SQL 마이그레이션을 재실행하지 않았다.
- `$env:CAMP_TEST_URL='http://127.0.0.1:5192'; npm.cmd run test:network`: 16명 별도 인증·15개 실제 루프백 WebRTC 연결 통과. 자리 비움 중 점프·메모·호출, 공 상태, 정상 퇴장·강제 종료·게임 수신 단절·지속 스케줄 지연의 승계와 이전 방장 복귀를 확인했다. 최종 epoch 5, HTTP 1,491회. 이 뒤의 수정은 패널/CSS/입력과 문서에 한정되어 네트워크 검사를 반복하지 않았다.
- 같은 `CAMP_TEST_URL`의 `npm.cmd run test:browser:community`: 최종 빌드에서 통과, 런타임 예외 없음. 공개 목록·초대 참가, 작업 시간, 메모/채팅 초안, 패널 전환 중 새 RTC 채팅과 읽던 위치, 한글 조합 이벤트, 숨긴 채팅의 호출과 확인, 필드 보기, 줌, 실제 Document PIP의 입력·상세·복귀, 390px 화면의 하단 메뉴·높이 축소·Escape/Enter 포커스, 퇴장과 검사 방 정리를 확인했다. 데스크톱 입력칸이 화면 안에 있는지도 검사했다.
- 스크린샷 `web/outputs/community-panel-browser.png`, `community-mobile-browser.png`, `community-field-browser.png` 생성. 앞의 두 화면과 Canvas 상태 장면을 직접 읽었다. 헤드리스 테스트는 별도 임시 프로필을 만들고 닫으며 개인 브라우저에 붙지 않는다. 검증용 Worker는 검사 후 종료했다.
- `git diff --check`: 추적 파일 변경의 공백 오류 없음. 새 문서·스킬의 로컬 링크 검사는 별도로 수행했다.

### 하네스와 스킬

[의도 기준](project-intent.md)에 사용자 근거·상태·적용 범위와 변경 이력을 작성하고 AGENTS에서 참조한다. 계획 스킬의 로컬 이름을 `camp-plan-interview`로 바꿔 공통 `plan-interview`와 구분했다. 제품 검토와 변경 검증 스킬은 현재 의도·승인을 기준으로 필요한 범위만 읽고 검사한다. 전역 규칙·설정·공통 스킬은 수정하지 않았다.

- Python 실행기를 찾지 못해 `skill-creator/scripts/quick_validate.py`를 직접 실행하지 못했다. 해당 검사 코드를 읽고 Node + 설치된 `js-yaml`로 YAML 구조·허용 키·이름/길이·설명·미완성 자리표시자·기존 UI 메타데이터를 검사했다. 세 스킬 모두 통과했다.
- 변경 문서와 스킬의 로컬 파일 참조 74개가 존재하고 이전 로컬 이름의 `SKILL.md`가 남지 않았음을 확인했다. 앵커와 지침 의미는 수동으로 대조했다.
- [하네스 행동 사례](../.agents/skills/camp-product-review/references/intent-cases.md)의 11개 사례를 현재 규칙과 수동 대조했다. 보호 제거와 개인 동의의 구분, 낡은 테스트 처리, 계획 전용 무변경, 단순 수정의 비적용, 제안/보류, 새 요청에 따른 보류 해제·기준 변경, 데이터와 목적의 구분, 실제 모순에서만 질문, 배포/전역/세션 권한 경계와 검증 한계를 확인했다. 별도 에이전트를 호출하거나 독립 행동 평가를 실행한 것은 아니다.

### 발견·수정 및 남은 한계

브라우저 검사에서 기본 패널의 열린 상태가 필드 보기 전환에 남는 문제와 CSS 표시 우선순위 충돌을 발견했다. 모드 전환 시 패널을 닫고 열림 스타일을 명확히 했으며, 필드 패널의 최소 높이와 채팅 목록 높이를 조정했다. 한글 조합 중 Escape로 채팅을 닫지 않도록 보완했다. 테스트 자체도 숨겨진 설정 버튼을 호출하던 기존 경로를 실제 기본 화면 전환으로 고쳤다. 수정 후 관련 전체 브라우저 흐름을 다시 통과했다.

첫 로컬 Worker 실행은 번들러 상위 경로 읽기 제한으로, 첫 샌드박스 헤드리스 실행은 CDP 초기화 시간 초과로 실패했다. 승인된 해당 로컬 검증 명령을 추가 권한으로 실행해 해결했으며 자동 승인 거절은 없었다. 런타임 오류를 무시하거나 공개 서비스에서 우회하지 않았다.

YouTube 검사는 외부 미디어 API를 대체한 PIP 소유권·가시성·복귀 검사다. 실제 음원 청취·광고·자동재생 허용, 물리 터치 기기·실제 가상 키보드, 인터넷 NAT/TURN, 장시간 최소화·기기 절전과 커뮤니티 사용성은 확인하지 않았다. 높이 축소와 합성 한글 조합 이벤트는 실물 모바일/IME 검증과 구분한다.

**공개 배포는 하지 않았다.** 마지막 기록된 공개 사이트는 버전 12·규약 v11이며, 이번 로컬 소스는 규약 v12다. 향후 배포 시 모든 참가자의 새로고침이 필요하다.

## 2026-11-04 보호 제거·화면 개선 공개 배포 (버전 13)

이후 사용자의 **“배포까지; 해줘”** 요청으로 위 검증 변경을 공개했다. 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`, 공개 접근 범위와 런타임 환경 리비전 1을 유지했다. 배포 준비와 게시에는 공식 Sites 스킬의 소스 도구·저장·배포 호출을 사용했다.

- 원본 저장소를 커밋하지 않고 기존 게시 전용 `outputs/site-source`를 열었다. 샌드박스 계정 소유와 실행 계정의 차이로 Git 소유권 검증이 처음 실패했다. 확인한 정확한 게시 경로에 한해 명령 실행 환경의 `safe.directory`를 지정해 해결했고 전역 Git/Codex 설정은 변경하지 않았다. 인증은 세션 메모리와 숨겨진 stdin으로만 전달했다.
- `outputs/prepare-intent-source.mjs`: 소스 **192개**, 빌드 파일 **91개**를 복사하고 SHA-256 일치를 확인했다. 애플리케이션 입력은 직전 검증 빌드와 같으며 실행 안내만 정정했다. 이전 공개 소스 대비 DB·마이그레이션·호스팅 바인딩 차이가 없음을 확인했다.
- 게시 소스 커밋: `9455e5ebc7ef1d5e53c80ed96d6d7d3936c84edd`. 아카이브: `outputs/huddlers-fire-intent-deploy.tar.gz`. 포함된 파일 91개가 게시 체크아웃과 일치했다. 파일이 없는 미리보기 임시 디렉터리 항목 3개는 있었지만 비밀값·Git·의존 패키지·로컬 상태 파일은 없었다. 처음 디렉터리까지 금지 파일로 판정한 검사를 실제 파일과 빈 디렉터리로 구분해 확인했다. helper의 매니페스트 위치는 `dist/.openai/hosting.json`이다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_f898dac82ff08191ae4367278d0dda80` (**사용자 버전 13**). 저장 아티팩트 91개, 소스 커밋 일치.
- 배포: `appgdep_6aea36c2f75c8191a3f1797dc91cb7d6`, 결과 **succeeded**. 주소: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- `node outputs/check-intent-deployment.mjs`: 공개 HTML HTTP 200, JS/CSS **18개**와 타이머 Worker **1개**의 SHA-256이 게시 빌드와 일치했다. Worker JavaScript MIME, 새 패널·상태 안내·작업 시간 코드, `afkProtected`의 공개 번들 부재, 공개방 API HTTP 200과 Discord 설정 활성 상태를 확인했다. 결과는 `outputs/intent-deployment-check.json`에 있다.
- 앞선 127개 검사·타입·빌드·Canvas·16명 RTC·격리 브라우저 결과를 재사용했다. 이번 공개 확인은 읽기 전용 HTTP이며 다른 이용자의 방·메시지나 개인 브라우저를 변경하지 않았다. DB SQL을 다시 적용하지 않았다.

통신 규약은 **v12**다. 이전 코드를 열어 둔 참가자는 모두 새로고침해야 한다. 실물 터치·실인터넷 NAT/TURN·실제 YouTube 청취·장시간 절전과 커뮤니티 경험의 미검증 범위는 앞선 기록과 같다.

## 2026-11-05 원래 사용 피드백 반영 검토

- 사용자 피드백 14개를 현재 소스와 INT-02·04·05·06 및 기존 구현/배포 기록에 대조했다. 결과는 [제품 검토](product-review.md#원래-사용-피드백-반영-여부-재검토-2026-11-05)에 기록했다.
- `web/`에서 `npm.cmd test`: **127개 통과**, 실패·취소·건너뛰기 0. 앉기/들기, 상태와 물리의 독립, 호출 제한·작성 시각·복구, 주요 통로, 줌/선택, 밀집 상태 배지, 방장 승계 관련 검사를 포함한다.
- 게임 코드·DB·설정·배포는 변경하지 않고 제품 검토와 이 검증 기록만 갱신했다. 검토 문서에서 참조한 로컬 파일의 존재와 `git diff --check`를 확인했다.
- 이번에는 typecheck/build, 브라우저·데스크톱 UI, Canvas 이미지 생성·육안 검토, 루프백/실인터넷 RTC, 운영 사이트 조회를 실행하지 않았다. PIP 실제 창 크기 조절·최상단 표시, 실물 모바일 통화/터치, 장애물 배치의 체감 개선을 이번 회귀 검사만으로 보장하지 않는다.

## 2026-11-05 라디오 자동 재생·개인 음소거

사용자가 승인한 자동 재생·개인 음소거 계획을 구현했다. 작업 시작 시 이미 수정돼 있던 이 문서와 제품 검토의 피드백 검토 기록을 보존하고 새 절만 추가했다. INT-06과 현재 제품 안내·구조 계약을 함께 갱신했다.

- `node --test tests/playback.test.mjs`: **12개 통과**. 초기 자동 로드·늦은 입장의 공유 시점, 음소거 선적용, 방장/참가자의 개인 음소거, 음량 복원, 음소거한 방장의 다음 곡, 전체 재생/정지 중 음소거 유지, 차단 후 재시도, 과거 설정 전환·저장을 검사했다.
- `npm.cmd test`: **132개 통과**, 실패·취소·건너뛰기 0. 이후 실행 코드 변경은 화면 배치 CSS에 한정했다.
- `npm.cmd run typecheck`, 최종 CSS를 포함한 `npm.cmd run build`: 통과. 빌드에는 기존 Vinext 정적 라우트 분류 안내가 있다.
- `npm.cmd run lint`: 오류 0, 기존 경고 4개(이미지 요소 2개·미사용 변수 2개). 추가 브라우저 검사와 YouTube 대체 API를 포함한 변경 재생/설정 파일의 선택 린트도 통과했다. `git diff --check` 통과.
- 기존 격리 DB `.wrangler/community-validation`을 사용하는 로컬 Worker `127.0.0.1:5191`에서 `npm.cmd run test:browser:community` 통과, 런타임 예외 없음. 듣기를 켜지 않은 기존 설정 사용자, 팝업을 열지 않은 늦은 참가자, 독립적인 음소거, 방장 음소거 중 다음 곡 전파, 페이지 이동 후 저장값 유지, 자동 재생 차단 안내·복구와 PIP 복귀의 음소거·단일 플레이어 유지를 확인했다. 채팅·상태·초안·필드 PIP·모바일 메뉴/높이 변화/포커스 회귀도 통과했다.
- 상시 플레이어가 데스크톱 채팅, 390px 모바일 메뉴·이동·동작·라디오 설정 버튼을 가리지 않는지 실제 DOM 좌표와 `elementFromPoint`로 검사했다. `web/outputs/community-panel-browser.png`, `community-mobile-browser.png`, `community-mobile-radio-browser.png`는 격리된 헤드리스 Chrome 결과다. YouTube 화면은 검사 대체 API의 빈 iframe이며 실제 영상 화면이 아니다.
- 초기 브라우저 검사에서는 곡 요청 간격 제한과 PIP 새 문서에 재주입되던 테스트 설정 초기화를 보정했다. 모바일 검사에서 확인한 라디오 설정/동작 버튼 겹침을 수정하고, 안내 토스트가 이동 버튼의 클릭을 막지 않도록 했다. 최종 변경으로 빌드·브라우저 검사를 재실행했다.
- 로컬 Worker의 파일 탐색 및 헤드리스 Chrome 초기화가 샌드박스에서 실패하여 해당 로컬 검증 명령만 추가 권한으로 실행했다. 빌드 출력 잠금은 테스트 서버를 종료한 뒤 재빌드해 해결했다. 개인 브라우저·데스크톱 UI·전역 설정을 조작하지 않았다.

브라우저의 YouTube IFrame API와 제목 조회 응답은 `tests/youtube-fixture.mjs`로 대체했다. 초기 실제 제목 조회 경로에서는 기존 Worker의 `redirect: 'error'` 비지원으로 500과 영상 ID 대체가 관찰됐으며 이번 범위에서 수정하지 않았다. 이번 통과는 실제 음원 청취·브라우저 자동 재생 정책·실물 모바일/절전·인터넷 NAT/TURN 검증이 아니다. 별도 16명 네트워크 검사는 실행하지 않았고 브라우저 검사의 로컬 RTC 참가·음악 전달만 확인했다. 통신 규약 v12·DB 스키마는 유지했으며, 마이그레이션·공개 배포는 실행하지 않았다.

## 2026-11-05 라디오 백그라운드 진행 후속 검증

- 사용자 후속 요청에 따라 `camp-playback.mjs`의 숨김에 따른 일시정지 조건을 제거했다. 화면 복귀 시 공유 위치/재생 상태를 복원하고, 백그라운드 곡 종료는 방장이 한 번만 전파한다. 숨긴 브라우저의 자체 정지는 전체 일시정지로 해석하지 않는다. 승계 중 정지·개인 음소거는 유지했다.
- `node --test tests/playback.test.mjs`: **13개 통과**. 숨긴 방장/참가자의 재생 유지, 브라우저 자체 정지의 격리, 복귀 위치·음소거, 숨긴 방장의 곡 종료 중복 방지, 참가자의 곡 전환과 전체 재생/정지를 포함한다.
- `npm.cmd run typecheck`, `npm.cmd run build` 및 변경 재생/UI/테스트 파일의 선택 ESLint: 통과, 선택 린트 경고·오류 0. 전체 게임 테스트와 16명 네트워크 검사는 이번 좁은 변경에서 반복하지 않았다.
- 격리 DB `.wrangler/community-validation`, 로컬 Worker `127.0.0.1:5191` 및 임시 프로필의 `npm.cmd run test:browser:community`: 통과, 런타임 예외 없음. PIP 없는 주 문서의 `document.hidden`을 모의해 재생 유지, 숨긴 방장의 다음 곡 RTC 전파, 브라우저 정지 이벤트의 로컬 처리, 복귀 음소거를 검사했다. 기존 PIP/채팅/모바일 버튼 검사를 함께 통과했다.
- 위 검사는 YouTube API·제목 조회 응답 및 숨김 상태를 대체/모의했다. 실제 탭 전환·최소화 상태의 음원 청취나 모바일 절전은 검증하지 않았다. 앱이 스스로 정지시키지 않는 것과 브라우저·기기 자체 제한 중 지속 실행을 보장하는 것은 구분한다.
- 안내·INT-06·구조·제품 방향/검토·README를 새 동작에 맞췄다. `git diff --check` 통과. 검사 서버를 종료했으며 통신 규약 v12·DB·공개 배포는 변경하지 않았다.

## 2026-11-05 라디오 공개 배포 (버전 14)

사용자의 후속 “배포해줘” 요청으로 자동 재생·개인 음소거·백그라운드 재생 변경을 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 공개했다. `get_site`에서 기존 공개 접근과 버전 13을 확인했고, 배포의 런타임 환경 리비전은 **1**을 유지했다.

- 공식 source helper로 `outputs/site-source`를 열고 소스 **193개**, 빌드 파일 **91개**를 검증한 `web/`와 SHA-256으로 대조했다. 인증값은 메모리와 숨겨진 stdin으로만 전달했다. 샌드박스/배포 계정의 Git 소유권 차이는 해당 명령의 `safe.directory` 환경 설정만 사용해 해결했으며 전역 설정은 바꾸지 않았다. 원본 저장소는 커밋하지 않았다.
- 게시 소스 커밋: `05720b6ed95d609f44ea2f7d4b690bee7e6e5778`. 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_88eb5aa2d7fc81919988319c4f0af548`, 사용자 버전 **14**.
- 최초 패키지의 `dist/server/.wrangler`에는 빈 미리보기 디렉터리만 있었다. 파일이 없음을 확인한 뒤 게시용 복사본에서 해당 경로만 제거하고 `outputs/huddlers-fire-radio-clean-deploy.tar.gz`로 다시 패키징했다. 환경 파일·Git·의존성·로컬 상태 경로가 제외됐음을 확인했다. 동일 소스에 대한 재저장은 같은 버전 14와 91개 파일의 저장 아티팩트를 반환했다.
- 배포 ID: `appgdep_6aebc8fc9b448191a933bc56a0cc132d`. 결과 **succeeded**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- `node outputs/check-radio-deployment.mjs`: 공개 HTML HTTP 200, JS/CSS **18개**와 타이머 Worker **1개**의 SHA-256이 로컬 게시 빌드와 일치했다. Worker의 JavaScript MIME, 개인 음소거 번들, 공개방 목록 API HTTP 200, Discord 설정 활성 상태를 확인했다. 결과는 `outputs/radio-deployment-check.json`에 기록했다.
- 직전 재생 검사 13개·타입·빌드·선택 린트·격리 브라우저 결과를 사용했고, 배포 확인을 위해 게임 검사를 다시 반복하지 않았다. DB 마이그레이션·접근 변경·런타임 값 변경은 없으며 기존 사용자의 방을 만들거나 변경하지 않았다.

통신 규약은 **v12**로 유지한다. 열어 둔 페이지를 새로고침하면 새 재생 동작이 적용된다. 공개 확인은 읽기 전용 HTTP/자산 일치 검사이며 실제 YouTube 청취·운영체제 절전·실인터넷 RTC를 검증한 결과는 아니다.


## 2026-11-05 별도 불멍·놀이터 맵 (INT-08, 규약 v13)

사용자가 승인한 별도 맵·놀이터 전용 놀이 계획을 구현했다. 시작 시 존재하던 라디오 자동 재생·개인 음소거·백그라운드 변경과 관련 문서·검사를 보존했다. 게임 규칙과 표시·입력·전송·복구·제품 기준을 함께 갱신했으며 DB 마이그레이션과 공개 배포는 실행하지 않았다.

- **전체 회귀:** web/에서 npm.cmd test **143개 통과**, 실패·취소·건너뛰기 0. 새 maps.test.mjs 10개는 불멍 기본 입장·시설 분리, 모든 장난감/들기 거절, 같은 좌표의 다른 맵에 대한 총·눈뭉치·폭발·공·들기 차단, 연쇄 중간 사람의 이동, 공중/낙사 이동과 현재 맵 복귀, 전체/변경분/복구, 이전 방문 입력 거절, 이동 시 보간 초기화, 렌더·선택 영역 분리를 검사한다. 기존 놀이 검사는 놀이터 기준으로 옮겼으며 불멍의 이동·라디오 검사는 유지했다.
- **타입·빌드:** 최종 코드의 npm.cmd run typecheck 및 npm.cmd run build 통과. Vinext의 기존 정적 라우트 분류 안내는 유지된다.
- **린트:** npm.cmd run lint 오류 0. 새 effect 내부 호출에서 발생한 의존성 경고를 useEffectEvent 경로로 수정했다. 이후 변경 파일의 선택 ESLint 오류 0, 기존 경고 3개(이미지 1·미사용 변수 2)였다. 전체에는 기존 player-info-panel.tsx 이미지 경고도 있다.
- **Canvas:** npm.cmd run test:render 통과. 불멍의 데스크톱·모바일·라디오·상태 배지와 놀이터의 동작·무기·연쇄·줄인 동작 장면을 실제 Canvas 렌더러로 생성했다. 브라우저 UI 검증과 구분한다.
- **16명 P2P:** 격리 DB .wrangler/community-validation의 로컬 Worker 127.0.0.1:5191에 대해 CAMP_TEST_URL을 지정한 npm.cmd run test:network 통과(1,542 HTTP 요청). 15개 실제 루프백 WebRTC 채널, 불멍 기본 입장·놀이 거절·혼합 맵 이동, 무기·공·연쇄, 패킷 손실/역순/재동기화, 정상 퇴장·강제 종료·게임 응답 단절·스케줄 지연에 따른 epoch 5까지의 승계를 검사했다. 정상 승계 후 불멍 참가자와 놀이터 참가자의 맵이 보존됨을 확인했다.
- **격리 브라우저:** 최종 빌드의 npm.cmd run test:browser:community 통과, 런타임 예외 없음. 임시 프로필의 헤드리스 Chrome에서 데스크톱·390px 모바일 왕복, 장난감 표시/장착·불멍 복귀 후 제거, 참가자 위치, 이동 버튼의 실제 클릭 가능 범위와 라디오 플레이어 단일 인스턴스를 검사했다. 기존 채팅/상태 초안·읽던 위치·공용 재생·개인 음소거·숨김·PIP·메뉴·높이 변경·Escape/Enter 포커스·퇴장 회귀도 통과했다.
- **산출물:** web/outputs/maps-playground-browser.png 및 maps-playground-mobile-browser.png를 직접 확인했다. 놀이터의 넓은 중앙 공터·트램펄린·공과 장소 왕복 버튼을 확인했다. 기존 community-*.png와 camp-*.png도 로컬 검증 산출물이다.
- **초기 실패와 수정:** 기존 단일 맵의 모닥불 장애물을 기대하던 검사를 각 공간의 장애물 기준으로 갱신했다. 첫 P2P 사격 검사는 타인이 사격 경로에 끼어드는 배치를 격리했고, 불멍에서 거절된 장착 요청의 대기시간이 끝난 뒤 지연 측정을 시작하도록 했다. 브라우저 검사에서 빠른 왕복이 이동 간격 제한에 걸려, 동일한 MAP_TRAVEL_COOLDOWN 상수를 이용해 응답 이후에도 이동 버튼의 대기 표시를 유지했다. 수정 후 관련 검사를 통과했다.
- **실행 환경:** 로컬 Worker의 파일 탐색과 헤드리스 Chrome의 CDP 초기화가 기본 샌드박스에서 실패하여 해당 로컬 검증 명령만 추가 권한으로 실행했다. 기존 격리 DB를 사용했으며 SQL을 다시 적용하지 않았다. 개인 브라우저·데스크톱 UI·전역 설정은 조작하지 않았다. 테스트 서버는 검증 후 종료한다.

YouTube API와 제목 조회는 검사 대체 API를 사용했으므로 실제 음악 청취를 새로 검증한 결과가 아니다. 실인터넷 NAT/TURN, 실물 터치·기기 절전과 실제 커뮤니티의 산만함 개선은 이번 로컬 결과로 보장하지 않는다. 새 규약은 **v13**이며 공개 배포 시 전원이 새로고침해야 한다. 현재 공개 사이트에 이 변경을 배포하지 않았다.

마무리 검사: git diff --check 통과. 의도 기준 변경을 intent-cases.md에 수동 대조해 최신 승인(INT-08) 적용, 상태 보호와 공간 규칙의 구분, 계획/구현/배포 경계를 확인했다. 별도 에이전트 행동 실행 검증은 하지 않았다. 검증용 로컬 Worker는 종료했다.


## 2026-11-05 별도 놀이터 공개 배포 (버전 15, 규약 v13)

사용자의 후속 “배포해줘” 요청에 따라 검증한 불멍·놀이터 분리 변경을 기존 공개 Sites 프로젝트에 배포했다. get_site에서 공개 접근과 직전 버전 14를 확인하고 같은 프로젝트·공개 범위·DB 바인딩·런타임 환경 리비전 1을 유지했다.

- 프로젝트: appgprj_6ae8e9ae42708191b253341387aa287f. 게시용 source helper로 기존 outputs/site-source를 열고 소스 195개를 원본 web/와 SHA-256으로 대조했다. 실행 코드 119개 중 최종 빌드보다 최신인 파일이 없으며 빌드 파일 91개도 게시용 복사본과 일치했다. 앞선 143개 회귀·타입·빌드·Canvas·16명 P2P·격리 브라우저 결과를 사용했으며 입력 변경 없이 검사를 반복하지 않았다.
- 공식 helper가 게시 전용 저장소에 커밋·푸시한 소스: fc9071e5db1522dc3620e159fe5cf4c6aa2ae201. 원본 저장소를 커밋하거나 전역 Git 설정을 바꾸지 않았다. Git 소유권 예외는 해당 명령의 환경 설정으로만 적용했다. 단기 인증값은 메모리와 숨겨진 stdin으로만 전달했다.
- 아카이브: web/outputs/huddlers-fire-playground-deploy.tar.gz. 게시용 복사본의 dist/server/.wrangler를 제거했고, 최종 tar의 환경 파일·의존성·Git·로컬 상태 경로 제외를 검사했다. 저장 아티팩트 파일 91개, SHA-256 ff5fc4dd245d3fac1df855508d9bcf245c7287283629c3c447eaf15ca32dd573.
- 저장 버전: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_7d2d5a409ce48191aa8144b3dd29dd8f, 사용자 버전 **15**.
- 배포: appgdep_6aebd5302d7881918a6de9018c0014a7, 결과 **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- 공개 확인: node outputs/check-playground-deployment.mjs 통과. HTML HTTP 200, JS/CSS 18개와 타이머 Worker 1개의 SHA-256이 게시 빌드와 일치했다. Worker JavaScript MIME, playground/change-map/mapRevision 및 왕복 버튼 번들, 공개방 목록 API HTTP 200을 확인했다. 결과는 web/outputs/playground-deployment-check.json이다.
- 소스 원격 접근과 공개 HTTP 확인은 기본 샌드박스의 네트워크 제한으로 실패해 해당 명령만 추가 권한으로 실행했다. DB 마이그레이션·환경값·공개 범위·다른 사용자의 방은 변경하지 않았다. 개인 브라우저나 데스크톱 UI를 조작하지 않았다.

공개 버전 15의 게임 통신 규약은 **v13**이다. 접속 중인 참가자는 모두 새로고침해야 한다. 공개 확인은 읽기 전용 HTTP와 파일 일치 검사이며, 실인터넷 RTC·실물 모바일·실제 YouTube 청취의 추가 검증을 뜻하지 않는다.


## 2026-11-05 통나무 불멍·밝은 놀이터·Discord 필수 입장 (규약 v14, 미배포)

사용자가 피드백 묶음 계획을 승인했다. 사람 숨김은 내 필드의 캐릭터·말풍선만, 라디오 탭은 음악·개인 소리만 관리한다는 답을 INT-09·10 및 관련 구조·제품 문서에 반영했다. 기존 변경을 보존하고 이번 구현과 검증만 진행했다. 공개 사이트는 앞서 배포한 버전 15·규약 v13을 유지한다.

- **핵심 회귀:** web/에서 npm.cmd test 152개 통과(실패·취소·생략 0). 새 immersion.test.mjs 9개는 16석 점유·거리·맵·공중·들기 제한, 이동/서기/점프/퇴장 해제, 연료 감소·잔불·장작 상한과 대기시간·중복 명령, 좌석/불의 full·delta·복구, 비정상 연료/시각·중복 좌석 거절, 개인 숨김의 범위, Discord 미연동 API 차단, 확대/복귀와 모바일 영상·조작을 피한 불 위 대화를 검증한다. 마지막 채팅 배치 수정 후 해당 9개를 재실행해 통과했다.
- **타입·빌드·정적 검사:** npm.cmd run typecheck 및 build 통과. 마지막 표시 수정 후 build 재통과. Vinext 기존 라우트 정적 분류 안내는 남는다. npm.cmd run lint 오류 0, 기존 경고 4개(img 2·미사용 변수 2).
- **Canvas:** npm.cmd run test:render 통과. campfire-focus.png·campfire-focus-mobile.png·campfire-embers.png·playground-daylight.png와 기존 장면을 실제 Canvas 렌더러로 생성했다. 브라우저 레이아웃 검사와 구분한다.
- **16명 P2P:** npm.cmd run test:network를 격리 QA 서버 127.0.0.1:5192에 실행해 통과(1,519 HTTP 요청). 실제 루프백 WebRTC, 혼합 맵, 장난감·연쇄·공, 좌석·장작 체크포인트와 정상 승계, 방장 종료·게임 응답 단절·스케줄러 지연에 따른 epoch 5까지의 복구를 확인했다. 이후 변경은 표시 및 잘못된 미래 불 시각 거절·복구 자료가 없을 때 불 초기화에 한정했으며 관련 단위 검사를 통과했다.
- **격리 브라우저:** 최종 빌드의 npm.cmd run test:browser:community 통과, 런타임 예외 없음. 연동 전 입장 차단·연동 후 입장, 통나무 앉기/서기/장작, 내 화면 숨김과 전체 채팅·다른 참가자 보존, 라디오 탭과 개인 소리, 장소와 무관한 R 열기, 상태·초안·읽던 위치, PIP, 모바일 클릭 영역·높이 변경을 확인했다. 실제 Ogg 약 60초 디코딩, 루프 소스 하나 및 장작 소스 한 번 생성도 확인했다. YouTube API·외부 Discord 응답은 검사 대체값이며 실제 서비스 동의/음원 청취 검증이 아니다.
- **발견과 수정:** 새 필수 연동에 맞게 API·RTC·브라우저 준비를 갱신했다. 브라우저에서 모바일 라디오 영상이 불·대화를 가리는 것을 발견해 재생을 유지하면서 불을 옆으로 확대하고 불 위 대화가 영상·버튼을 피하도록 했다. immersion-seated-mobile-browser.png와 immersion-seated-browser.png를 직접 확인했다.
- **소리 자산:** public/audio/campfire.ogg는 Glaneur de sons의 CC BY 3.0 녹음이다. [Wikimedia 원본 설명](https://commons.wikimedia.org/wiki/File:Campfire_sound_ambience.ogg)의 라이선스를 확인했고 public/audio/CREDITS.txt 및 라디오 안내에 출처를 제공한다. 합성 잡음 대신 녹음을 반복하고 경계 블렌드·연료별 음량·장작 순간 레이어를 적용했다. 실제 스피커 청취 품질과 커뮤니티의 몰입감은 미검증이다.
- **검증 환경:** tests/local-immersion-server.mjs의 메모리 SQLite와 테스트 전용 OAuth 공급자 응답을 사용한다. 운영 인증 우회 경로를 추가하지 않았다. 로컬 기존 DB 마이그레이션 재실행·공개 DB 변경·배포는 하지 않았다. 로컬 Worker와 임시 프로필의 헤드리스 Chrome만 필요한 권한으로 실행했으며 개인 브라우저·데스크톱 UI를 조작하지 않았다.

상태 계약은 v14이므로 향후 공개 배포 시 모든 참가자의 새로고침이 필요하다. 실제 Discord 동의, 실인터넷 NAT/TURN, 휴대폰 터치·절전·실제 YouTube와 음향 청취는 이번 기술 검사로 보장하지 않는다. 의도 관련 문서는 intent-cases.md의 사례에 수동 대조해 최신 사용자 답과 구현/배포 경계를 구분했다.

마무리: git diff --check 통과. 검증용 Worker와 QA 서버를 종료했다. 모바일 최종 이미지는 라디오 재생 영역 옆에 불이 보이고, 대화가 불 위에서 버튼·영상을 피하는 것을 확인했다.


## 2026-11-05 통나무 불멍 공개 배포 (버전 16, 규약 v14)

사용자의 “배포해주고 확인이 필요한건 질문해줘” 요청에 따라 앞서 검증한 구현을 기존 Sites 프로젝트에 배포했다. 배포 전 get_site에서 공개 접근·버전 15를 확인하고 같은 프로젝트·접근 범위·DB·환경 리비전 1을 유지했다. 공개 session API에서 Discord 설정이 준비된 상태임을 확인했다.

- 프로젝트: appgprj_6ae8e9ae42708191b253341387aa287f. Sites source helper로 outputs/site-source를 열어 원격 기준을 확인한 뒤 원본 web/의 소스 202개를 SHA-256 대조해 복사했다. 게시용 복사본만 helper가 커밋·푸시했다. 원본 저장소 커밋·전역 설정 변경은 하지 않았다. 자격증명은 메모리와 숨긴 stdin으로만 전달했다.
- 소스 커밋: 7166430519f4eea5c3aaf9283e9ed7adf69c9c28. 최종 빌드보다 최신인 실행 입력 파일은 없고, 게시 복사본의 빌드 93개가 검증한 원본과 일치했다. 기존 152개 회귀·타입·빌드·Canvas·16명 P2P·격리 브라우저 결과를 재사용했다. 실행 코드 변경이 없어 검사를 반복하지 않았다.
- 아카이브: web/outputs/huddlers-fire-immersion-deploy.tar.gz. 게시 복사본의 dist/server/.wrangler는 정확한 대상 경로를 검증한 뒤 제거했다. tar에 환경 파일·로컬 상태·Git·node_modules가 없는 것을 검사했고 모닥불 Ogg와 출처도 포함했다. 서버 보관 아티팩트는 93개, SHA-256 53142ac459e75eddbb7e587511aca6b583cb09527deb6f04a8893ded2f4db2ba.
- 저장 버전: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_f7876ac9cb7c81919225dc39614f0f65, 사용자 버전 16.
- 배포: appgdep_6aebe3d67c988191851861b759a6f63b, succeeded, 환경 리비전 1. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- 공개 확인: node outputs/check-immersion-deployment.mjs 통과. HTML 200, JS/CSS 18개·음원/출처 2개 및 타이머 Worker 1개의 SHA-256이 게시 빌드와 일치했다. 좌석·장작·라디오 탭 코드 표식, 공개 방 목록 200, Discord 설정 준비 및 미인증 방 생성 401을 확인했다. API 검사로 새 방이나 세션을 만들지 않았다. 결과는 web/outputs/immersion-deployment-check.json에 남겼다.
- 첫 공개 검사는 음원 MIME을 audio/ogg로 가정해 실패했다. 실제 응답은 application/octet-stream이지만 Ogg 헤더와 파일 해시는 일치한다. 앱은 fetch한 바이트를 decodeAudioData로 직접 디코딩하며 같은 파일의 실제 Chromium 디코딩은 로컬 검사에서 통과했다. 확인 도구를 실제 바이트·해시 검사로 바꿔 재통과했으며 이 때문에 앱이나 배포를 다시 바꾸지 않았다.

기존 참가자는 모두 새로고침해야 한다. 실제 Discord 계정 동의 후 입장과 실제 스피커의 모닥불 소리는 사용자에게 확인을 요청한다. 휴대폰·실인터넷 NAT/TURN·기기 절전·YouTube 실제 청취의 기존 미검증 범위는 남는다. 개인 브라우저·데스크톱 UI를 조작하지 않았으며 DB 마이그레이션이나 환경값 변경을 하지 않았다.


## 2026-11-05 효과음 음량 조절 수정

공개 버전 16 확인 후 사용자가 “모닥불 음향 조절이 안되는데 확인…효과음 전반 음향으로 수정”을 요청했다. 설정/라디오/팝업을 효과음 음량으로 통일하고 effectsVolume으로 이전했다. 기존 forestVolume 값과 명시적 무음·음악 선택을 보존한다. UI 상태를 오디오 재개/로딩 완료 뒤에 갱신하던 것을 즉시 갱신으로 바꾸고 저장값 복원도 오디오에 연결했다. 늦은 오디오 준비가 무음을 되돌리지 않게 하며 장작의 별도 출력도 공통 master GainNode에 연결했다.

- npm.cmd test 154개 통과(실패·취소·생략 0). 새 회귀는 오디오 resume/녹음 로딩 대기 중 무음, 늦은 로딩의 소스 재시작 방지, 반복음과 장작의 공통 gain 경로, 효과음 설정 이전과 새 0 우선순위를 확인한다.
- npm.cmd run typecheck 및 build 통과. 변경 파일 ESLint 오류 0, camp.tsx 기존 img 경고 1. 실행 입력은 최종 빌드 이후 바뀌지 않았다. 물리·API·P2P 규약을 바꾸지 않아 이번에는 16명 연결/Canvas 검사를 반복하지 않았다.
- 격리 헤드리스 Chromium의 실제 WebAudio로 녹음 응답을 의도적으로 지연하고 40→15→0→75 연속 조절의 즉시 UI/저장·최신 master 값을 확인했다. 두 설정 화면의 값 일치, 네이티브 range 방향키, 라디오의 독립 음량을 검사했다. 실제 반복/장작 출력이 존재하는 것을 analyser로 확인한 뒤 무음의 PCM 값 0을 확인했다. 새로고침 후 저장된 효과음 값과 오디오 복원도 검사했다. 이는 실제 스피커 청취 품질 평가와 구분한다.
- 검사 준비 중 fetch를 오디오 생성 뒤에 감쌌던 지연 주입을 문서 초기화 시점으로 옮겼다. gain.value를 같은 JS 작업에서 읽는 가정은 WebAudio 렌더링 주기를 반영하도록 고쳤다. 음소거 저장값은 즉시 0이며 실제 오디오 출력은 다음 렌더링 주기에 0이 된다.

검증에는 loopback Worker와 테스트 전용 메모리 API/OAuth 공급자를 사용했다. 개인 브라우저·데스크톱 UI는 조작하지 않았다. 공개 배포 결과는 아래에 별도로 기록한다.

최종 확인: npm.cmd run test:browser:community 통과, 런타임 예외 없음. 기존 작업시간 검사가 수동 상태 변경 직후 1초 표시 갱신 전에 값을 읽어 실패해, 상태 반영과 표시 주기 이후에 멈춤을 확인하도록 검사만 안정화했다. 효과음 조절·실제 PCM 무음·복원과 기존 입장/상태/초안/채팅/모바일/PIP 회귀를 모두 통과했다.

### 효과음 수정 공개 결과 (버전 17, 규약 v14 유지)

기존 공개 사이트에 수정본을 배포했다. Sites source helper가 게시 전용 복사본 소스 202개를 동기화·커밋·푸시했다. 실행 입력은 검증한 빌드 이후 변경되지 않았고 배포 빌드 93개의 SHA-256을 원본과 대조했다. 아카이브의 환경 파일·로컬 상태·Git·node_modules 제외를 확인했다.

- 소스: dc046ce4367a366ed65b844af6cf67ef6c31f18b. 아카이브: web/outputs/huddlers-fire-effects-deploy.tar.gz. 저장 아티팩트 SHA-256 06a01c84cf93e6ac2574aca661657f198e0ba4fe523fbd85ca5e00ec1b24561a(93개).
- 버전: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_dbcc8ffb8acc8191ac215ceab6b7413b, 공개 버전 17. 배포: appgdep_6aebe7a82c4481918ade33c9ef3e952b, succeeded. 기존 public 접근·DB·환경 리비전 1 유지.
- URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . node outputs/check-effects-deployment.mjs 통과. HTML·방 목록 200, JS/CSS·음원/출처 합계 20개와 타이머 Worker 1개가 게시 빌드와 일치했다. effectsVolume·효과음 음량/끄기 표식과 Discord 설정 준비·미인증 방 생성 401도 확인했다. 새 세션·방을 만들지 않았다. 결과: web/outputs/effects-deployment-check.json.

개인 브라우저·데스크톱 조작, 원본 저장소 커밋·전역 설정, DB 마이그레이션·환경값 변경 없이 완료했다. 검증용 Worker와 QA 서버를 종료했고 git diff --check를 통과했다. 사용자는 새로고침하면 새 효과음 조절을 사용할 수 있다. 실제 스피커의 음질 취향과 기기별 오디오 정책은 기존 기술 검사와 구분한다.

## 2026-11-05 통나무 E 개선·장작 공동 성장 (규약 v15, 미배포)

사용자가 “방의 모닥불이 공동 성장”, “방 전체에 함께 적용”을 선택하고 계획의 구현·검증을 승인했다. 기존 작업 트리의 수정은 보존하면서 통나무 접근·비동기 E 자세 입력, 인당 10분 장작, 공동 XP·레벨·선택 외형을 추가했다. INT-09·제품 방향·현재 상태 계약을 갱신했다. 공개 배포·DB 마이그레이션·계정 영구 저장은 수행하지 않았다.

- **회귀:** `web/`에서 `npm.cmd test` **158개 통과**, 실패·취소·생략 0. 추가 회귀는 통나무 8개 양쪽/끝·바닥 앉기 접근·거리 경계·점유 대체, 두 참가자의 독립된 600,000ms 대기와 정확한 만료 경계, 실패·중복 명령의 XP/대기시간 보존, 외형 해금·불멍 참가자 권한, full/delta/승계의 XP·외형·개인 대기시간 유지, 비정상 XP와 미지/미해금 외형 거절을 확인한다. 외형 변경 중 장작 소리가 다시 재생되지 않는 회귀도 포함했다.
- **타입·빌드·lint:** `npm.cmd run typecheck`, `npm.cmd run build` 통과. `npm.cmd run lint` 오류 0, 기존 경고 4개(img 2·미사용 변수 2). Vinext 기존 라우트 정적 분류 안내는 남는다. 이후 앱 실행 코드는 바뀌지 않았고 렌더 산출물의 한글 폰트·테스트 대기·문서만 정리했다.
- **Canvas:** `npm.cmd run test:render` 통과. `web/outputs/campfire-level-styles.png`에 5종 외형과 같은 연료 조건·각 잔불을 비교해 직접 확인했다. 최초 비교 이미지의 한글 폰트를 Malgun Gothic으로 지정해 다시 생성·확인했다. 기존 좌석 확대·모바일·놀이터 장면도 통과했다. 이는 앱의 Canvas 직접 렌더 결과이며 브라우저 UI 검사와 구분한다.
- **16명 P2P:** `CAMP_TEST_URL=http://127.0.0.1:5292`에서 `npm.cmd run test:network` 통과(**1,508 HTTP 요청**). 세 사람이 각각 장작을 넣어 XP 3·2레벨을 달성하고 비방장이 선택한 gold 외형이 16명에게 전달됐다. 정상 승계 후에도 좌석·연료·공동 XP·외형을 보존하고 같은 참가자의 추가 장작을 10분 대기 규칙으로 거절했다. 기존 혼합 맵·놀이·연쇄·채팅·음악, 방장 종료·전체 게임 응답 손실·스케줄러 지연에 따른 epoch 5까지의 복구를 통과했다. 첫 실행에서는 추가 대기시간 검사 요청이 실제 10분 판정보다 먼저 250ms 요청 제한에 걸려 문구 기대가 실패했다. 해당 요청 제한이 지난 뒤 실제 대기시간 거절을 검사하도록 테스트를 수정해 재실행했다.
- **격리 브라우저:** 같은 최종 빌드의 `npm.cmd run test:browser:community` 통과, 런타임 예외 없음. 임시 프로필 headless Chromium에서 실제 E keydown/keyup과 후속 틱에도 좌석이 유지됨, 장작 +1 XP·남은 대기시간·해금 전 선택지 비활성화, 기존 클릭/터치 앉기·모바일 버튼 접근과 PIP를 확인했다. `immersion-seated-browser.png`, `immersion-seated-mobile-browser.png`를 직접 확인했다. 기존 효과음 PCM 무음/복원·라디오·패널 초안·채팅 위치·입장 회귀도 통과했다. 외부 Discord·YouTube 응답은 테스트 대체값이다.
- **검사 환경:** 테스트 전용 QA 서버를 5292, 빌드 Worker를 5291에 실행해 기존 포트와 분리했다. QA harness의 upstream 환경변수만 추가했고 앱 인증 우회는 추가하지 않았다. 기본 샌드박스에서 Wrangler의 상위 경로 탐색과 Chrome CDP 초기화가 각각 실패해 해당 로컬 서버/격리 테스트 명령만 자동 검토를 통한 추가 권한으로 실행했다. 개인 브라우저·데스크톱 UI 조작과 다른 세션 호출은 하지 않았다.

현재 수치는 장작 1회 +1 XP, 3 XP마다 레벨업, 최고 5레벨이다. 주황·황금·파랑·초록·보라 외형을 해금하고 누구나 선택한 모습을 방 전체에 적용한다. 방이 끝나면 성장 기록을 초기화한다. 실인터넷 NAT·실물 모바일·커뮤니티의 성장 속도 선호는 이번 기술 검사로 확인한 것으로 취급하지 않는다. 통신 규약은 v15이며 향후 배포 시 모든 참가자가 함께 새로고침해야 한다.

### 장작 공동 성장 공개 결과 (버전 18, 규약 v15)

사용자의 후속 “배포해줘” 요청으로 검증한 INT-09 변경을 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 배포했다. `get_site`에서 공개 접근·직전 버전 17을 확인하고 같은 사이트·공개 범위·DB·환경 리비전을 유지했다.

- **소스·빌드 준비:** 공식 Sites source helper로 `web/outputs/site-source`를 열었다. `prepare-growth-deploy.mjs`에서 실행 입력 157개가 검증한 빌드보다 새롭지 않음을 확인하고 소스 203개와 빌드 파일 93개를 SHA-256으로 원본과 대조했다. 앞선 회귀 158개·타입·빌드·Canvas·16명 P2P·격리 브라우저 검증 이후 실행 입력 변경이 없어 같은 검사를 반복하지 않았다. 게시 전용 복사본의 `dist/server/.wrangler`를 제거하고 아카이브에 Git·의존성·환경 파일·로컬 상태가 없음을 검사했다.
- **게시 소스:** `e4f7a2d4e6ff1dd97ae8afb64561d6b0d967da1e`. 공식 helper가 게시 전용 저장소에서만 커밋·푸시했다. 원본 저장소 커밋이나 전역 Git 설정은 바꾸지 않았다. Git 소유권 예외와 제외 파일 설정은 해당 명령의 환경변수로만 적용했고 단기 자격증명은 메모리·숨겨진 stdin으로만 전달했다.
- **아카이브:** `web/outputs/huddlers-fire-growth-deploy.tar.gz`. 저장 아티팩트 93개, SHA-256 `a42584b166995ccb1df697de3ecd3efe8788d793f96fc9b1212d06836b75e3ac`.
- **저장 버전:** `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_3a95f91d5b4881919aee919d2365dd95`, 공개 버전 **18**.
- **배포:** `appgdep_6aebf35843508191ab0c082900cc1c3d`, **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site .
- **공개 검증:** `node outputs/check-growth-deployment.mjs 18` 통과. HTML·방 목록 HTTP 200, JS/CSS 및 음원·출처 합계 20개와 타이머 Worker 1개가 게시 빌드와 일치했다. 공동 XP·외형 선택·남은 장작 시간 코드, Discord 연결 준비 상태와 미인증 방 생성 401을 확인했다. 새 세션·방을 만들지 않았고 기존 방은 조작하지 않았다. 결과: `web/outputs/growth-deployment-check.json`.

기본 샌드박스의 Git 서버·공개 HTTPS 연결 차단은 해당 명령만 추가 권한으로 실행해 해결했다. 개인 브라우저·데스크톱 UI 조작, DB 마이그레이션, 비밀값·공개 접근 변경은 하지 않았다. 공개 버전 18의 통신 규약은 **v15**이므로 접속 중인 모든 참가자가 새로고침해야 한다. 공개 파일 일치·응답 검증은 실제 인터넷 RTC 플레이 검증과 구분한다.

## 2026-11-05 신청곡 자동 시작·지형 위 이름표·휠 확대/축소 (미배포)

사용자가 세 항목의 계획을 승인해 로컬 구현·검증을 완료했다. 기존 작업 트리의 수정은 보존했다. 공유 상태의 필드·명령 스키마와 DB는 바뀌지 않아 통신 규약 v15를 유지한다. 공개 사이트 버전 18에 이번 후속 변경을 배포하지 않았다.

- **동작:** 첫 유효 신청과 대기열 소진 뒤의 신청은 방장 조작 없이 시작한다. 현재 곡이 있으면 재생 위치나 수동 일시정지를 바꾸지 않고 대기열에만 추가한다. 이름표는 지형·신체·효과·비네트 뒤, 말풍선/상태 배지 앞에 그리며 클릭도 신체보다 우선한다. 휠은 Canvas 위에서만 배율을 75~300%로 조절하고 왼쪽 상단 확대·축소 버튼과 배율 표시는 제거했다.
- **회귀:** `web/`에서 `npm.cmd test` **163개 통과**, 실패·취소·생략 0. 자동 시작·재생 중 추가·일시정지 보존·대기열 소진 후 재시작·늦은 종료 이벤트 거절·중복 지급 없는 단일 transport/revision·일관된 승계 음악 상태를 확인했다. 대기곡 제한과 제목 검사는 첫 곡이 current로 바로 이동하는 새 계약에 맞췄다. 휠의 pixel/line/page 단위·작은 트랙패드 입력·상하한·Ctrl/잠금/비활성·해제 후 입력, 이름표가 신체 위에 표시될 때 선택 우선순위를 검사했다.
- **가림 픽셀 검사:** 양쪽 맵, DPR 1/2, 배율 0.75/1/3, 서기/앉기/들린 자세의 36가지 조합에서 불투명한 전경을 그려도 이름표 픽셀이 남고 해당 이름표를 선택할 수 있음을 확인했다. 복귀 중인 참가자의 이름이 남지 않는 것도 확인했다. 부동소수점 휠 왕복은 1e-12 허용 오차로 비교했다.
- **타입·빌드:** `npm.cmd run typecheck`, `npm.cmd run build` 통과. 최초 타입 검사에서 새 휠 계산 함수의 매개변수 타입 누락을 발견해 JSDoc을 추가했고 최종 타입 검사를 통과했다. Vinext 기존 라우트 정적 분류 안내는 남는다. 빌드 후 앱 실행 코드는 바뀌지 않았다.
- **Canvas:** `npm.cmd run test:render` 통과. 기존 장면과 새 `camp-nameplates.png`·`camp-nameplates-mobile.png`·`playground-nameplates.png`를 생성했다. 불멍 데스크톱/모바일 이미지를 직접 확인해 나무·텐트 앞에 이름표가 표시되는 것을 확인했다. Canvas 직접 렌더 결과이며 브라우저 DOM 검사와 구분한다.
- **격리 브라우저:** `CAMP_TEST_URL=http://127.0.0.1:5392`의 `npm.cmd run test:browser:community` 통과, 런타임 예외 없음. 첫 신청 후 “모두 재생”을 누르지 않고 재생되는 것, 최상단 확대/축소 버튼 제거, 실제 mouseWheel 입력으로 125% 확대, 채팅 위 wheel이 배율을 바꾸지 않음, 전체 보기 초기화와 PIP 소유 Canvas의 wheel을 확인했다. 기존 입장·개인 음소거·다음 곡·초안/채팅 읽던 위치·모바일·장작/소리 회귀도 통과했다. Discord/YouTube는 외부 제공자 대체값이며 실제 서비스 음원 청취 검증이 아니다.
- **16명 P2P:** 같은 QA 서버의 `npm.cmd run test:network` 통과(**1,516 HTTP 요청**). 일반 참가자의 신청만으로 모든 참가자에게 현재 곡·제목·playing 상태가 전달됐고, 방장의 별도 play 명령을 제거한 상태로 확인했다. 기존 음악 시각·대기열·정상 승계·방장 종료/게임 응답 손실/스케줄러 지연에 따른 epoch 5까지의 복구와 장작 공동 성장 회귀도 통과했다. 실제 루프백 WebRTC이며 실인터넷 NAT·브라우저 간 RTC와 구분한다.
- **환경·경계:** 검사 전용 QA 서버 5392와 빌드 Worker 5391을 사용했다. 기본 샌드박스가 Wrangler 상위 경로 읽기를 차단해 해당 로컬 서버 명령만 추가 권한으로 실행했고, Chrome CDP 초기화의 기존 제약에 따라 격리 headless 검사도 추가 권한으로 실행했다. 개인 브라우저/데스크톱 UI, 다른 세션 호출, 전역 설정·DB 마이그레이션·공개 사이트 변경은 하지 않았다.

INT-03·04·06, 제품 방향·구조·이용 안내를 새 동작에 맞춰 갱신했다. 실제 YouTube 자동 재생 허용·실물 기기·커뮤니티 경험은 이번 기술 검증으로 완료했다고 주장하지 않는다.

## 2026-11-05 모바일 라디오 창 축소 (미배포)

사용자가 YouTube 유지를 선택한 뒤 모바일에서만 축소할 방법을 요청했다. 공식 표시 요건을 확인하고 영상은 200×200px 이상으로 유지하면서 모바일 전용 여백·안내·미지원 PIP 버튼 행을 줄였다. 수정 범위는 `music-player.tsx`의 미지원 도구 클래스와 `globals.css`의 760px 이하 `.in-camp` 표시 규칙이다. 데스크톱과 별도 음악 PIP 창은 같은 표시를 유지한다.

- `npm.cmd run typecheck`, `npm.cmd run build` 통과. Vinext의 기존 라우트 정적 분류 안내만 남는다.
- `CAMP_TEST_URL=http://127.0.0.1:5492`에서 `npm.cmd run test:browser:community` 통과, 런타임 예외 없음. 데스크톱 폭 242px·안내문 유지, 모바일 외곽 폭 214px·iframe 200×200px 이상·긴 안내문 숨김을 확인했다. 미지원 상태의 클래스도 격리 페이지에서 재현해 PIP 도구 행이 숨겨지고 전체 높이 260px 이하이며 음소거 버튼의 터치 중심을 가리지 않는지 검사했다. 실제 지원 여부는 기존 capability 값에서 결정한다.
- 기존 모바일 조작 버튼·통나무 앉기·개인 음소거·라디오 재생·패널·PIP·화면 크기 전환 회귀도 통과했다. `community-mobile-radio-browser.png`, `immersion-seated-mobile-browser.png`를 직접 확인했다. 영상은 테스트 YouTube API의 대체 화면이며 실제 서비스 영상/광고·실물 모바일 검증은 아니다.
- 공유 상태·재생 로직·Canvas 렌더러는 바꾸지 않아 직전의 회귀 163개·16명 P2P 검사를 재실행하지 않았다. 이번 결과와 직전 검사 결과를 구분한다. 통신 규약 v15·DB 스키마·YouTube 신청 방식은 유지한다.
- 검사 전용 빌드 Worker 5491과 QA 서버 5492를 사용했다. 앞선 샌드박스 제약에 따라 로컬 Worker와 격리 headless 명령만 추가 권한으로 실행했다. 개인 브라우저·데스크톱 UI를 조작하거나 다른 세션을 호출하지 않았다. 테스트 서버는 종료했다.

공개 사이트 버전 18은 유지하며 이번 모바일 축소와 앞선 신청곡/이름표/휠 변경은 아직 배포하지 않았다. 공식 요건: https://developers.google.com/youtube/terms/required-minimum-functionality#embedded-youtube-player-size .

### 신청곡·이름표·휠·모바일 축소 공개 결과 (버전 19, 규약 v15)

사용자의 후속 “배포하고 커밋 푸시도 해줘” 요청에 따라 위 검증 변경을 기존 공개 사이트에 배포했다. `get_site`에서 공개 접근과 직전 버전 18을 확인했다. 원본 저장소는 main·origin `https://github.com/biru100/HuddlersFire.git`이며, 원격 main이 로컬 기준 `7471fa5b07a030b2325c25a814fc155b3c754c04`와 같음을 확인했다. 원본의 이전 승인·배포 변경도 미커밋이어서 현재 검증된 앱 상태의 관련 소스·문서·음원을 함께 커밋·푸시하는 범위를 확인했다.

- **준비:** 공식 Sites source helper로 게시 전용 `web/outputs/site-source`를 열었다. `prepare-interface-deploy.mjs`는 실행 입력 157개가 최종 빌드보다 새롭지 않고, 소스 203개와 빌드 93개가 원본과 SHA-256으로 일치함을 확인했다. 직전 회귀 163개·16명 P2P와 모바일 최종 타입·빌드·격리 브라우저 이후 실행 입력 변경이 없어 같은 검사를 반복하지 않았다. 복사본의 `dist/server/.wrangler`를 제거하고 환경 파일·Git·의존성·로컬 상태가 아카이브에 없는지 검사했다.
- **게시 소스:** `1b58ca9b3dc5a0d99221b78264f3a612e82b20ba`. 공식 helper가 게시 전용 저장소에서 커밋·푸시했다. 원본 프로젝트의 GitHub 커밋과는 별도의 게시용 커밋이다. 전역 설정을 바꾸지 않고 명령 범위의 소유권 예외·제외 파일을 사용했다. 단기 인증값은 메모리·숨겨진 stdin으로만 전달했다.
- **아카이브:** `web/outputs/huddlers-fire-interface-deploy.tar.gz`. 저장된 빌드 93개, 아티팩트 SHA-256 `54ff30e11f8f2e7954765ae1e9745708b84042f180f5ba3e9782d2b017c866de`.
- **저장 버전:** `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_47c6ddd557d88191915b78f0e8d94dac`, 사용자 버전 **19**.
- **배포:** `appgdep_6aec03fdb89c819196dc06c6c8f8e416`, **succeeded**, 환경 리비전 **1**. 공개 URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 기존 public 접근·DB·서버 환경과 규약 v15를 유지했다.
- **공개 확인:** `node outputs/check-interface-deployment.mjs 19` 통과. HTML·공개 방 목록 HTTP 200, JS/CSS·음원·출처 합계 20개와 타이머 Worker 1개가 게시 빌드와 일치했다. 신청곡 자동 시작 안내·별도 이름표 그리기·휠 안내·모바일 214px 축소 CSS·미지원 PIP 행 처리 코드, Discord 연결 준비 및 미인증 방 생성 401을 확인했다. 새 세션·방은 만들지 않았고 기존 방도 조작하지 않았다. 결과: `web/outputs/interface-deployment-check.json`.

원본 main의 커밋은 이 배포 기록을 포함한 관련 변경을 대상으로 한다. 빌드·로컬 상태·비밀 설정은 제외한다. 배포·원격 조회·공개 HTTPS 확인에는 기존 샌드박스의 네트워크 제한에 맞춰 해당 명령만 추가 권한을 사용했고 개인 브라우저·데스크톱 UI는 조작하지 않았다. 전역 설정·공개 범위·DB 마이그레이션은 변경하지 않았다. 사용자는 새로고침하면 변경을 사용할 수 있다.

## 2026-11-05 방 종료 시 1회 새로고침 (후속 버전 20 배포)

사용자 “방터지면 바로 새로고침 한번…유령방에 재접속” 요청(INT-11)에 따라 확정 종료 시 URL의 room을 지우고 한 번 새로고침한다. 새 로비에서 종료 안내를 표시하고 notice를 제거하며 다른 쿼리·해시는 보존한다. 입장 세대로 모든 연결 콜백을 제한해 이전 연결의 늦은 응답과 중복 종료가 새 연결을 지우거나 다시 새로고침하지 않도록 했다.

- **오인 종료 수정:** 최초 16명 검사에서 정상 방장 퇴장 후 참가자도 모두 종료되는 실패를 발견했다. 방 조회 성공 직후 이전 방장을 대상으로 한 signal의 403도 poll 전체의 종료 오류로 처리하던 경로다. 이 조건을 단위 회귀로 재현해 수정 전 실패를 확인한 뒤, 방 조회 요청 자체의 401·403·404·410만 확정 종료로 처리하도록 수정했다. 수동 퇴장의 체크포인트 배출 중 완료된 poll도 종료 알림을 발생시키지 않는다.
- **회귀·타입·빌드:** 최종 `npm.cmd test` **167개 통과**, `npm.cmd run typecheck`, `npm.cmd run build` 통과. 종료 상태 4종의 1회 정리·종료 후 조회/재접속 금지, 오프라인/503 유지, signal 403과 정상 퇴장 배출 중 오류를 검사했다. 실행 중인 Wrangler가 산출물을 잡고 있어 한 차례 빌드가 EPERM으로 실패했고, 본인 서버를 종료한 뒤 재빌드에 성공했다. Vinext 기존 라우트 정적 분류 안내는 남는다.
- **16명 P2P:** `CAMP_TEST_URL=http://127.0.0.1:5592`의 최종 `npm.cmd run test:network` 통과, **1,459 HTTP 요청**. 정상 방장 퇴장 후 14개 연결 재구성, 방장 강제 종료 후 13개 연결 복구, HTTP 생존 중 게임 응답 손실과 스케줄러 지연의 epoch 5까지 승계를 확인했다. 기존 방 코드·채팅·음악·맵·공·연쇄·장작 성장/대기시간을 보존했다. 로컬 Node WebRTC이며 실인터넷 NAT 검증과 구분한다.
- **격리 브라우저:** 같은 QA 서버에서 최종 `npm.cmd run test:browser:community` 통과, 런타임 예외 없음. 실제 API로 본인이 만든 방의 참여 정보를 제거한 뒤 다음 실제 poll에서 새 문서가 로드되는지, room과 일회성 notice 제거·빈 코드 입력·다른 쿼리/해시 유지·5초 뒤에도 새로고침 횟수 1회·로비 잔류를 확인했다. 앞선 503 두 번에는 같은 문서·방 연결을 유지했다. 모바일·PIP·라디오·입력·소리와 일반 퇴장 회귀도 통과했다. 최종 빌드의 중간 재검사에서는 React 입장 준비 전 설정 버튼을 눌러 대기 실패가 있었고, 서버 프로필 반영 후 입장 가능 상태까지 기다리도록 테스트를 보완한 뒤 전체를 통과했다. 외부 Discord/YouTube는 대체 제공자이며 실제 서비스·실물 모바일 확인은 아니다.
- **환경·정리:** 빌드 Worker 5591과 QA API 5592만 사용하고 검사 후 종료했다. 기존 샌드박스의 상위 경로 읽기·CDP 제약 때문에 로컬 Worker와 개인 브라우저와 분리된 임시 headless 검사 명령만 추가 권한으로 실행했다. 전역 설정·다른 세션·개인 브라우저/데스크톱 UI·공개 방은 조작하지 않았다. `git diff --check`도 통과했다.

공유 상태·DB 스키마·통신 규약 v15는 유지한다. 확정 종료는 다음 방 조회 응답에서 확인한 시점에 처리하며, 단순 recoveryWaiting이나 일시적인 네트워크 실패는 새로고침 조건이 아니다. 위 구현·검증 완료 시점에는 공개 사이트 버전 19와 원격 Git을 변경하지 않았다.

### 방 종료 수정 공개 결과 (버전 20, 규약 v15)

후속 사용자 “배포해줘” 요청에 따라 검증한 수정본을 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 배포했다. `get_site`로 기존 버전 19·public 접근을 확인하고 공식 source helper로 같은 게시 저장소를 열었다. 실행 입력 157개가 최종 빌드보다 새롭지 않고 소스 203개·빌드 93개가 원본과 일치함을 확인해 직전 167개 회귀·타입·빌드·16명 P2P·최종 격리 브라우저 검사를 반복하지 않았다.

- 게시 소스: `a4b04e02380a5efdd4593c4c2c034ab451ce6ae2`. 공식 helper가 게시 전용 `web/outputs/site-source`에서 커밋·푸시했다. 원본 GitHub 저장소는 이번 요청으로 커밋·푸시하지 않았다.
- 아카이브: `web/outputs/huddlers-fire-room-reload-deploy.tar.gz`, 빌드 93개, SHA-256 `153dcac7d7571864e927da00fe7d6b0ca45609fe0fedf95e0c27dcb0a8a3ecf7`. 환경 파일·Git·의존성·로컬 런타임 상태는 포함하지 않았다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_44939e9d45c08191a7eb398e80a21cc5`, 사용자 버전 **20**.
- 배포: `appgdep_6aec0b94d7208191992c703b2b14d0d2`, **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 기존 public 접근·DB·런타임 설정을 유지했다.
- 공개 확인: `node outputs/check-interface-deployment.mjs 20` 통과. HTML·공개 방 목록 HTTP 200, JS/CSS·음원·출처 20개와 타이머 Worker 1개가 게시 빌드와 SHA-256으로 일치했다. 새 `room-ended` 안내와 `location.reload()` 코드를 확인하고 Discord 연결 준비·미인증 방 생성 401도 확인했다. 공개 방·새 세션은 만들지 않았다. 결과는 `web/outputs/interface-deployment-check.json`이다.

기본 샌드박스의 Git HTTPS 차단 후 공식 helper·공개 HTTPS 확인 명령만 추가 권한으로 실행했다. 단기 인증값은 메모리와 숨겨진 stdin으로만 전달했으며 전역 설정·개인 브라우저·다른 세션은 조작하지 않았다. 공개 사이트에서 종료를 강제로 발생시키지는 않았고 실제 1회 새로고침 동작은 앞선 로컬 격리 브라우저로 검증했다. 기존 참가자는 한 번 새로고침해 새 코드를 적용할 수 있다.

## 2026-11-05 맵 2배 확장·포탈·게임 전시장 검증 (규약 v16, 미배포)

사용자가 각 맵의 가로·세로 “약 2배씩”을 선택하고 계획 구현·검증을 승인했다. 기존 방 종료 수정 등 작업 트리의 선행 변경은 보존하고 맵·포탈·전시장·게임 소개를 추가했다. 사용자 요청에 따라 프로젝트 로컬 `camp-plan-interview/SKILL.md`를 삭제하고 AGENTS와 현재 의도 문서의 참조를 공통 `plan-interview`로 정리했다. 공통 스킬·전역 설정은 수정하지 않았다.

### 구현 및 계약

- `camp-maps.mjs`에 세 맵의 경계·포탈·전시 부스를 정의했다. 바닥 한 변은 12→24타일, 지면 끝 6→12로 확장하고 걷기·상태 검증·낙사·공 복귀·투사체 경계와 렌더링을 함께 맞췄다. 기본 카메라는 캐릭터를 따라가고 전체 보기에서는 확장한 지형을 맞춘다.
- `change-map`은 포탈 ID·목적지·현재 mapRevision을 필수로 받는다. 방장과 솔로의 같은 함수에서 출발 맵·거리·지상 상태를 검증하며 기존 원거리 버튼 이동은 제거했다. 도착 지점·연쇄 해제·이전 방문 입력 거절·중복 요청 방지를 유지한다. 새 맵 ID와 명령 의미 변경에 따라 규약 v16이며 DB 마이그레이션은 없다.
- 전시장 PARRUITS! 부스에 다가가 E/화면 버튼으로 소개 팝업을 연다. 2026-11-05 clukostudio.com에서 확인한 소개·로고·장면과 Steam·공식 사이트·YouTube·프레스킷 링크를 사용했다. 두 공식 이미지 총 71,540바이트와 CREDITS.txt를 `public/games/`에 저장했다. 팝업의 포커스·입력 잠금·닫기·Escape·필드 복귀를 연결했다. 모바일에서는 라디오를 하단에 두고 실제 높이만큼 소개 영역을 확보한다. 본문만 스크롤해 닫기 버튼은 계속 접근할 수 있다.

### 실행 결과

| 검사 | 결과와 범위 |
| --- | --- |
| `npm.cmd test` | **172개 통과**, 실패·취소·건너뛰기 0. 포탈 원거리/위조/낡은 방문 거절, 세 맵의 실제 확장 지면·낙사·부스 근접, 전시장 놀이 차단, 전체/변경분·채팅·승계 복구를 포함한다. 예전 어디서든 이동·기존 가장자리 수치는 새 계약에 맞게 갱신했다. |
| `npm.cmd run typecheck` | 통과. 최종 팝업·상태 타입 포함. |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개. camp.tsx·player-info-panel.tsx 이미지 경고와 camp-renderer.mjs·camp-world.mjs 미사용 변수 경고다. 새 검사/팝업에서 생긴 경고·오류는 정리했다. |
| `npm.cmd run build` | 최종 빌드 통과. Vinext의 기존 동적 경로 분류 안내가 출력되며 빌드 오류는 없다. |
| `npm.cmd run test:render` | 통과. 실제 Canvas 코드로 확장 불멍·놀이터·전시장·부스·모바일 포탈과 기존 장면을 생성했다. `expanded-camp.png`, `showroom-booth.png`, `camp-portal-mobile.png`를 직접 확인했다. |
| `npm.cmd run test:network` | **16명 루프백 실제 WebRTC 통합 통과**, HTTP 요청 1,542회. 전시장 왕복과 맵을 기록한 채팅, 포탈 명령 거절, 전체/변경분·공·모닥불·연쇄, 정상 퇴장·강제 종료·RTC 손실·스케줄 지연의 epoch 5까지 승계를 확인했다. |
| `npm.cmd run test:browser:exhibition` | 최종 빌드에서 통과. 격리된 headless Chrome의 **1280×900·390×844** 화면에서 실제 키보드 이동→포탈 왕복→부스 상호작용, 근접만으로 자동 열리지 않음, 정적 이미지 로드·새 탭 링크·포커스·입력 잠금·Escape/닫기, 모바일 팝업/라디오 비겹침·스크롤 후 링크와 닫기 버튼 접근을 확인했다. 런타임 예외 0. |
| `npm.cmd run test:browser:community` | 통과. 기존 맵 버튼 검사를 실제 포탈 접근으로 갱신했고, 좌석·모닥불 성장·상태/채팅 초안·공용 라디오와 개인 소리·필드/음악 PIP·모바일·방 종료 1회 새로고침을 확인했다. 런타임 예외 0. 본문 스크롤 분리는 이후 전시장 전용 검사로 최종 확인했다. |
| 문서·하네스 | `git diff --check` 통과. 삭제 스킬의 현재 링크가 없음을 확인했다. 의도 하네스 사례의 계획/구현/배포·최신 결정 우선 규칙을 수동 대조했다. 독립 에이전트 행동 검증으로 주장하지 않는다. |

새 검사 이미지 `game-intro-desktop.png`, `game-intro-mobile.png`, `game-intro-links-desktop.png`, `game-intro-links-mobile.png`와 로그 `map-exhibition-*.log`는 `web/outputs/`에 있다. 최초 모바일 이미지에서 라디오 겹침을 발견해 수정 후 비겹침과 링크 접근 검사를 추가했고 최종 이미지를 다시 생성했다. 테스트 위치를 강제로 배치한 16명 검사에서는 1 미만 거리의 보간 수렴을 기다리다 실패해 fixture를 즉시 반영되는 배치로 바꿨다. headless 도보 경로의 장애물 여유·앉기 해제도 검사 코드에서 보정했다.

로컬 API는 `tests/local-immersion-server.mjs`의 메모리 SQLite·모의 Discord OAuth를 사용했고 빌드 미리보기는 별도 `.wrangler/map-exhibition-preview`에 뒀다. 기본 DB·공개 방·개인 브라우저는 조작하지 않았다. 공식 자산 다운로드, 보호된 로컬 스킬 삭제, 로컬 Worker/격리 Chrome의 샌드박스 접근 제한은 해당 명령만 추가 권한으로 해결했다. 사용한 로컬 서버는 검증 후 종료했다.

이 결과는 루프백 RTC·격리 Chromium·모의 YouTube API의 기술 검증이다. 실물 모바일, 다른 브라우저·실제 YouTube 청취/자동재생, 실인터넷 NAT와 커뮤니티의 공간 탐색 만족도는 별도 확인 범위다. **공개 배포·커밋·푸시는 하지 않았다. 공개 사이트 버전 20·규약 v15와 로컬 최신 v16을 구분한다.**

### 맵 확장·전시장 후속 공개 결과 (버전 21, 규약 v16)

후속 사용자 “배포해줘” 요청으로 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 공개 배포했다. `get_site`로 기존 버전 20·public 접근을 확인했다. 공식 source helper로 게시 전용 `web/outputs/site-source`를 먼저 열고, 검증한 소스 211개와 빌드 96개의 일치를 확인했다. 실행 입력 159개가 최종 빌드 이후 바뀌지 않아 직전 172개 회귀·타입·빌드·16명 P2P·최종 격리 브라우저 검사를 반복하지 않았다. 결과는 `web/outputs/map-exhibition-deploy-inputs.json`이다.

- 게시 소스: `dd0d8d43e10e7009421a1b83dec7a29499ffff81`. 공식 helper가 게시 전용 저장소에서 커밋·푸시했다. 원본 GitHub 저장소의 작업 트리·인덱스·원격은 커밋·푸시하지 않았다.
- 아카이브: `web/outputs/huddlers-fire-map-exhibition-deploy.tar.gz`, 96개 파일. 로컬 gzip SHA-256 `36cddfb5f655bb044cdff8070c4c7e39a3b1f839ed308ebbb6e613ce3bf702c8`. 저장 서비스의 tar 내용 해시 `79a4ebf2fe43cadd8e00f93774809b3d77fe7fb660794699b7b8ddbd8c3d3422`. 환경 파일·Git·의존성·로컬 런타임 상태는 제외했다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_d7c2258efb348191bd5e9d8c64a22eb5`, 사용자 버전 **21**.
- 배포: `appgdep_6aec184b17e88191a36bcf6447f7b23c`, **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 기존 public 접근·DB·런타임 설정을 유지했다.
- 공개 확인: `node outputs/check-map-exhibition-deployment.mjs 21` 통과. HTML·공개 방 목록 HTTP 200, JS/CSS·음원·게임 이미지/출처 23개와 타이머 Worker 1개가 게시 빌드와 SHA-256으로 일치했다. 전시장·포탈·소개 팝업과 모바일 라디오 비겹침 CSS를 확인하고 Discord 준비 상태·미인증 방 생성 401도 확인했다. 공개 방이나 새 세션은 만들지 않았다. 결과는 `web/outputs/map-exhibition-deployment-check.json`이다.

게시 helper의 최초 Git 인식 실패는 추가 권한 프로세스와 기존 게시 저장소의 소유자가 달라 Git이 거절한 것이었다. 정확한 게시 경로만 그 프로세스의 `safe.directory` 환경 설정으로 전달해 해결했고 전역 Git 설정은 수정하지 않았다. 단기 인증값은 메모리와 helper의 숨겨진 stdin으로만 전달했다. 개인 브라우저·데스크톱 UI·다른 세션을 조작하지 않았다. 기존 참가자는 모두 한 번 새로고침해 규약 v16을 적용해야 한다.

## 2026-11-05 부스 공통 템플릿·이미지·트레일러·SNS (규약 v16 유지, 미배포)

사용자의 후속 요청에 따라 `createGameExhibit` 공통 형식과 필드 대표 이미지·트레일러 중심 소개·SNS 아이콘을 구현했다. 다른 게임의 작성/배치 예제는 `docs/game-exhibits.md`에 있다. 기존 게임 소개 기능과 새 템플릿을 구분하며 게임 등록 UI·DB·공유 상태·통신 버전은 변경하지 않았다.

- **공식 자료 확인:** clukostudio.com의 표시 링크와 구조화 자료에서 YouTube·X·Instagram·Discord·Reddit 주소를 확인했다. 공식 @PARRUITS 채널의 영상 목록에서 `s0pMzMwvKgE`를 찾고 YouTube oEmbed HTTP 200으로 제목 `PARRUITS! - Official Announcement Trailer`와 게시자 `PARRUITS!`를 확인했다. 틱톡은 링크 미등록으로 둔다. 계정이 존재하지 않는다는 조사 결과로 취급하지 않는다.
- **부스 이미지:** 로컬 대표 이미지를 같은 비율로 잘라 그리고 로딩을 캐시한다. 실패 시 게임 이름을 남기고 반복 요청을 막는다. 실제 Canvas의 픽셀 검사와 오류 재시도 방지 검사로 확인했다. 대표 이미지·영상·SNS가 빈 추가 게임도 같은 형식을 쓸 수 있다.
- **트레일러:** 작은 로고/제목 다음의 가장 큰 영역에 YouTube iframe을 배치했다. 영상 ID를 검증하고 자동 재생 없이 원본 보기 링크도 제공한다. 팝업 닫기 때 iframe을 제거하며 공용 라디오·음소거 값을 변경하지 않는다. 모바일 최소 영상 크기는 200×200px이고 기존 라디오 공간 분리를 유지한다.
- **SNS:** 6개 아이콘을 같은 순서로 표시한다. HTTPS·플랫폼 주소가 있는 5개만 새 탭 링크이고, TikTok은 href 없는 disabled/aria-disabled 버튼이다. 빈 문자열·공백·잘못된 주소·프로토콜·인증정보가 든 URL도 비활성 처리한다. Simple Icons v15.0.0의 로컬 SVG 6개와 CC0 출처를 `public/icons/social/`에 저장했다.

| 검사 | 결과 |
| --- | --- |
| `npm.cmd test` | **175개 통과**, 실패·취소·건너뛰기 0. 새 템플릿의 빈 항목·독립 데이터, SNS 링크 검증·미등록, YouTube ID·자동 재생 미지정과 부스 이미지 픽셀·실패 캐시 검사를 포함한다. |
| `npm.cmd run typecheck` | 통과. 공통 게임 데이터와 팝업·아이콘 렌더 포함. |
| `npm.cmd run lint` | 오류 0, 기존 경고 4개. 새 경고 없음. |
| `npm.cmd run build` | 최종 빌드 통과. 기존 Vinext 동적 라우트 분류 안내는 유지한다. |
| `npm.cmd run test:render` | 통과. 부스 대표 이미지를 실제 캐시에 주입해 production Canvas 코드로 PC·모바일 장면을 생성하고 `showroom-booth.png`를 직접 확인했다. |
| `npm.cmd run test:browser:exhibition` | **1280×900·390×844 통과**, 런타임 예외 0. 실제 키보드 포탈 왕복·부스 이미지 로드, 트레일러 영상 ID·200px 이상 영역·자동 재생 미지정·닫을 때 iframe 제거, 활성 SNS 5개/비활성 1개와 SNS·관련 링크·닫기 버튼의 실제 클릭 지점 접근, 입력 잠금·필드 포커스 복귀·모바일 라디오 비겹침을 확인했다. |

`game-booth-desktop.png`, `game-intro-desktop.png`, `game-intro-links-mobile.png`를 직접 확인했다. 로그는 `web/outputs/exhibit-template-*.log`에 있다. Headless 검사는 개인 프로필과 분리된 Chrome을 사용하고 트레일러 iframe 응답·라디오 API만 대체하므로 실제 YouTube 스트리밍·광고·음성·실물 모바일 검증을 의미하지 않는다. 로컬 API는 기존 메모리 SQLite/모의 OAuth, Worker는 별도 `.wrangler/exhibit-template-preview`를 사용했다. 기본 DB·개인 브라우저·다른 세션·공개 방을 조작하지 않았다. 공유 물리·통신·복구가 바뀌지 않아 앞선 16명 RTC와 전체 community 브라우저 검사를 반복하지 않았다.

공개 사이트는 버전 21·규약 v16을 유지한다. **이번 부스 템플릿은 아직 배포·커밋·푸시하지 않았다.**

### 부스 템플릿 후속 공개 결과 (버전 22, 규약 v16)

후속 사용자 “배포해줘” 요청으로 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 배포했다. `get_site`에서 기존 버전 21·public 접근을 확인하고 공식 source helper로 같은 게시 전용 저장소를 먼저 열었다. 소스 218개·빌드 103개의 복사 일치와 실행 입력 159개가 최종 빌드 이후 바뀌지 않음을 확인했다. 직전의 175개 회귀·타입·빌드·Canvas·PC/모바일 headless 검사는 입력이 같아 반복하지 않았다. 준비 결과는 `web/outputs/exhibit-template-deploy-inputs.json`이다.

- 게시 소스: `ea3d5c20899efb4ef8792f586860fbb3b25c4a39`. 공식 helper가 `web/outputs/site-source`에서 커밋·푸시했다. 원본 GitHub 저장소는 이번 요청으로 커밋·푸시하지 않았다.
- 아카이브: `web/outputs/huddlers-fire-exhibit-template-deploy.tar.gz`, 103개 파일. 로컬 gzip SHA-256 `e37376ba26900b8f43f97daa962c3f9b45ed1c1a65ca0661445f1a6edbb21871`. 저장 서비스 tar 해시 `79bb2bb767e605198425c6c807ea6041d58c6556427817a4a896f916e107c010`. 환경 파일·Git·의존성·로컬 런타임 상태는 제외했다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_db4e7d66bb448191bca267de87ce2386`, 사용자 버전 **22**.
- 배포: `appgdep_6aec1d0bd15481918322a85ad03a0df0`, **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 기존 public 접근·DB·런타임 설정을 유지했다.
- 공개 확인: `node outputs/check-exhibit-template-deployment.mjs 22` 통과. HTML·공개 방 목록 HTTP 200, JS/CSS·음원·게임 이미지·SNS SVG/출처 등 30개 파일과 타이머 Worker 1개가 게시 빌드와 SHA-256으로 일치했다. 부스 이미지 캐시·트레일러 영상 ID/임베드·SNS 표시 코드도 확인했다. Discord 연결 준비 상태·미인증 방 생성 401을 확인했으며 공개 방이나 새 세션은 만들지 않았다. 결과는 `web/outputs/exhibit-template-deployment-check.json`이다.

단기 인증값은 메모리와 helper의 숨겨진 stdin으로만 전달했다. 게시 저장소 소유자 차이는 해당 프로세스의 정확한 경로 `safe.directory` 설정으로 처리했고 전역 설정·개인 브라우저·데스크톱 UI·다른 세션은 조작하지 않았다. 이번 공개 검사는 배포 파일과 API의 확인이며 실제 YouTube 스트리밍·실물 모바일 검증을 추가로 주장하지 않는다. 기존 참가자는 새로고침해 최신 부스 UI를 사용할 수 있다.

## 2026-11-05 부스 대표 이미지 YouTube 썸네일 교체·배포 (버전 23, 규약 v16 유지)

사용자 “부스 대표이미지는 유튜브 썸네일로 해줘 바로 배포까지해줘”에 따라 기존 게임 장면 대신 공식 트레일러 썸네일을 적용하고 즉시 배포했다. 실제 `https://i.ytimg.com/vi/s0pMzMwvKgE/maxresdefault.jpg`를 받아 1280×720·166,375바이트임을 확인했다. 원본을 `public/games/parruits-trailer-thumbnail.jpg`에 저장하고 공통 게임 정보의 cover와 출처를 갱신했다. 기존 로고·영상·SNS·공유 상태·DB·규약은 유지한다. 이미지 픽셀/실패 캐시와 브라우저 부스 로드 검사의 파일명은 게임 정보에서 읽게 맞췄다.

- `npm.cmd test` **175개 통과**, 실패·취소·건너뛰기 0. `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:render` 통과. 원본 썸네일과 실제 Canvas `showroom-booth.png`를 직접 확인했다. 대표 이미지 데이터·정적 파일만 바뀌어 기존 팝업/모바일 headless·16명 RTC 검사는 반복하지 않았다. 로그는 `web/outputs/thumbnail-*.log`에 있다.
- `get_site`에서 기존 버전 22·public 접근을 확인하고 공식 source helper로 같은 게시 저장소를 열었다. 소스 219개·빌드 104개의 일치와 실행 입력 159개가 최종 빌드 후 바뀌지 않음을 확인했다. 준비 결과는 `web/outputs/thumbnail-deploy-inputs.json`이다.
- 게시 소스: `e0b420efc729e8fa0ff8b431ad64512720998f42`. 공식 helper가 게시 전용 `web/outputs/site-source`에서 커밋·푸시했다. 원본 GitHub 저장소는 커밋·푸시하지 않았다.
- 아카이브: `web/outputs/huddlers-fire-thumbnail-deploy.tar.gz`, 104개 파일. 로컬 gzip SHA-256 `b3aa1745be6eb5fdded89c5131f8c5f70a4bf39d5bedc6c7c47c6791ddb6ec67`. 저장 서비스 tar 해시 `a4ad1f49698c4f11b5ab31ceeb817737388dc9d06a5eb28d23e0b9be775fca78`. 환경 파일·Git·의존성·로컬 상태는 제외했다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_86195ad4c0e081919e6540edccf9433d`, 사용자 버전 **23**.
- 배포: `appgdep_6aec1f6ee9088191bc753bce32c565f3`, **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 기존 public 접근·DB·런타임 설정을 유지했다.
- 공개 확인: `node outputs/check-thumbnail-deployment.mjs 23` 통과. HTML·공개 방 목록 HTTP 200, 새 썸네일을 포함한 파일 31개와 타이머 Worker 1개가 검증 빌드와 SHA-256으로 일치했다. 부스가 새 썸네일 경로를 참조하는 코드와 Discord 준비 상태·미인증 방 생성 401도 확인했다. 공개 방·새 세션·개인 브라우저는 조작하지 않았다. 결과는 `web/outputs/thumbnail-deployment-check.json`이다.

게시 저장소 접근은 해당 프로세스에만 정확한 경로의 safe.directory를 지정했고 전역 설정은 수정하지 않았다. 단기 인증값은 메모리와 숨겨진 stdin으로만 전달했다. 새 이미지 파일명과 새 번들로 배포해 이전 대표 이미지 캐시와 구분하며, 기존 참가자는 새로고침해 확인할 수 있다.

## 2026-11-05 게임 전시 부스 추가 스킬

사용자가 승인한 계획에 따라 프로젝트 로컬 `camp-add-game-booth` 스킬, UI 메타데이터, YouTube 썸네일 준비 도구와 오프라인 검사를 추가했다. `AGENTS.md`에서 선택 기준을 연결하고 `docs/game-exhibits.md`에 호출·도구 사용법을 추가했다. 기존 스키마 문서를 재사용하며 게임 화면·카탈로그·맵·공개 사이트는 변경하지 않았다.

- `node --test .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.test.mjs`: **17개 통과**, 실패·취소·건너뛰기 0. YouTube URL·경로 입력, maxres/hq 대체, 작은 플레이스홀더·HTML·손상 JPEG·8 MiB 초과·네트워크 오류, 두 후보 실패 시 파일 미생성, 기존 파일 보존·명시적 교체, 프로젝트 밖/연결된 디렉터리 차단, 출처·해시 출력을 검사했다. 실제 네트워크 대신 모의 응답과 생성한 JPEG를 사용했다.
- `node --check …/prepare-thumbnail.mjs` 통과. 실제 CLI의 `--help`와 `--dry-run`을 실행했다. dry-run의 다운로드·파일 생성 금지는 오프라인 검사에서도 확인했다.
- `node web/outputs/validate-booth-skill.mjs` 통과. 기존 `js-yaml`로 YAML frontmatter의 허용 필드·이름·설명·미완성 표시, UI 설명 길이·호출 문구·기본 자동 선택을 검사하고 문서 세 곳의 로컬 참조 **15개**와 도구 경로를 확인했다. Python/py 실행기가 없어 공식 `quick_validate.py`는 실행하지 않았으며, 해당 검증 규칙을 읽고 Node에서 대응 검사를 수행했다. 전역 도구·설정은 설치하거나 수정하지 않았다.
- 공식 자료가 충분한 신규 추가, SNS/트레일러 미확인, 기존 부스 갱신, 계획만 요청, 배포 미승인 사례를 규칙 검토로 확인했다. 새 ID·위치 검증을 요구하고 PARRUITS! 중심 기존 검사나 모의 iframe 결과를 새 게임/실제 YouTube 검증으로 확대하지 않도록 명시했다. 이는 독립 에이전트 실행 평가가 아니다.
- `git diff --check` 통과. 작업 전후 `web/app`, `web/lib`, `web/public`, `web/tests`의 경로·내용 합성 SHA-256은 모두 `13dfbcafe4ca4e05f0a4cc052b149af51006b01172c21cb23672a67d956a7850`으로 같았다. 게임 실행 코드가 바뀌지 않아 게임 전체 검사·빌드·브라우저·RTC 검사는 반복하지 않았다. 실제 YouTube 다운로드·재생과 새 게임 부스 추가·공개 배포는 이번 검사 범위가 아니다.

## 2026-11-05 Torizon Telecom 전시 부스 추가 (로컬, 규약 v16 유지)

사용자의 “승인하고 구현”에 따라 기존 공통 템플릿으로 Torizon Telecom을 두 번째 부스로 추가했다. 게임 ID `torizon-telecom`, 부스 ID `torizon-telecom-booth`, 좌표 `(4, -2)`, 반경 `.85`다. 기존 PARRUITS!는 위치와 데이터를 유지했다. 소개 팝업·렌더러·라디오 구현을 복제하거나 변경하지 않았고 게임 데이터와 배치만 연결했다. 공유 필드·규약·DB 마이그레이션은 추가하지 않았다.

공식 게임 페이지 `https://madeinskago.com/TorizonTelecom/`의 원본 로고 PNG(566×180, 2,412바이트)와 소개를 사용했다. 개발사 Steam 공지가 연결한 영상 `eDon6CQezQY`는 실제 YouTube oEmbed HTTP 200에서 제목 `Torizon Telecom Gameplay Trailer`, 제작자 `SkagoGames`, 채널 `https://www.youtube.com/@skagogames`, 임베드 응답을 확인했다. 스킬의 썸네일 도구로 maxres JPEG 1280×720·97,428바이트를 실제 다운로드·디코딩했으며 SHA-256은 `e65fc3b8b88bf8bb59e0b55b4d6a4cb1e109720574cc39874ce8e80f294c471f`다. 원본 출처와 권리는 `web/public/games/CREDITS.txt`에 기록했다. 조사 자료는 `web/outputs/torizon-source-*.txt`, 썸네일 결과는 `web/outputs/torizon-thumbnail.json`이다.

- `npm.cmd test`: **177개 통과**, 실패·취소·건너뛰기 0. 기존 175개에 카탈로그/부스 고유 ID·연결, 접근 지점, 부스/포탈 범위 분리, 이미지 디코딩·크레딧과 Torizon의 영상·Steam 본편/데모·SNS 상태 검사를 추가했다. 로그: `web/outputs/torizon-tests.log`.
- `npm.cmd run typecheck`, `npm.cmd run build` 통과. 로그: `torizon-typecheck.log`, `torizon-build.log`. 빌드의 vinext 정적 경로 분류 안내는 빌드 실패가 아니다.
- `npm.cmd run test:render`: **35개 렌더 통과**. 새 부스의 데스크톱/모바일 Canvas 산출물 `showroom-torizon-telecom.png`, `showroom-torizon-telecom-mobile.png`와 원본 자산을 직접 확인했다. 로그: `web/outputs/torizon-render.log`.
- `npm.cmd run test:browser:exhibition`: **두 게임 × PC·모바일 네 조합 통과**, 브라우저 실행 예외 0. 각 부스까지 실제 키 입력으로 걸어가 올바른 제목·로고·영상 ID/원본 링크·SNS별 정확한 활성/비활성·관련 링크를 확인했다. Torizon은 YouTube·X·Discord·Reddit 활성, Instagram·TikTok 비활성이다. 자동 열림/재생 금지, 팝업 중 입력 잠금·모바일 라디오와의 분리, 스크롤 뒤 아이콘·링크·닫기 버튼 접근, 닫을 때 iframe 제거·필드 포커스 복귀를 확인했다. 재생 중인 라디오의 곡·재생 상태·음량·플레이어 유지와 개인 음소거를 팝업 개폐 전후 비교했다. 기존 다른 맵 포탈 왕복도 통과했다. 로그: `web/outputs/torizon-browser.log`.
- `game-intro-torizon-telecom-desktop.png`, `game-intro-links-torizon-telecom-desktop.png` 및 같은 이름의 `mobile` 산출물을 직접 확인했다. 검사는 일회용 headless 프로필, 루프백 QA API/SQLite·모의 Discord, 별도 `.wrangler/torizon-preview`를 사용했다. 외부 트레일러 iframe 응답과 라디오 API는 fixture로 대체했다. 개인 브라우저·기본 DB·공개 방은 조작하지 않았다. 검사 후 로컬 서버 두 개를 종료하고 Node HTTP 연결에서 5191/5192 모두 `ECONNREFUSED`임을 확인했다. QA 서버는 Ctrl+C 뒤 남아 있어 정확한 명령줄로 확인한 작업 프로세스 PID 19244를 종료했다.
- 초기 제한 환경의 외부 fetch는 실패해 승인된 공식 자산 HTTPS 접근을 확장 권한으로 완료했다. 제한 환경의 Wrangler 상위 경로 읽기 오류와 headless CDP 초기화 시간 초과도 기록하며, 동일 로컬 검증을 확장 권한으로 완료했다. 자동 승인 심사 거절은 없었다. 전역 설정은 변경하지 않았다.

`camp-product-review`로 승인한 INT-12·13 흐름을 대조해 제품 검토를 갱신했다. 문서·코드의 `git diff --check`도 통과했다. 실제 YouTube 스트리밍·음향 청취·실물 모바일 터치·게임 내부 플레이·외부 SNS 가입/계정 소유는 검사하지 않았다. 네트워크·복구 구현은 바뀌지 않아 전체 16명 RTC 검사를 반복하지 않았다. **공개 사이트는 버전 23을 유지하며 이번 Torizon Telecom 추가는 아직 배포·커밋·푸시하지 않았다.**

### Torizon Telecom 후속 공개 결과 (버전 24, 규약 v16 유지)

사용자 “배포해줘” 요청으로 위 검증본을 기존 Sites 프로젝트 `appgprj_6ae8e9ae42708191b253341387aa287f`에 배포했다. `get_site`로 버전 23·public 접근을 확인하고 공식 Sites source helper로 기존 게시 저장소를 열었다. `node web/outputs/prepare-torizon-deploy.mjs`에서 게시 소스 221개의 복사 일치, 빌드 파일 106개의 SHA-256 일치, 실행 입력 159개가 최종 검증 빌드 뒤 변경되지 않았음을 확인했다. 로컬 상태는 제외했고 새 로고·썸네일·크레딧도 원본 자산과 빌드가 일치했다. 앞선 177개 회귀·타입·빌드·Canvas 35개·두 게임 PC/모바일 검사는 동일 입력이므로 반복하지 않았다. 준비 기록: `web/outputs/torizon-deploy-inputs.json`.

- 게시 소스: `f0d5fef4f9288ba71c8733b39d1d9805b62163ff`. 공식 helper가 게시 전용 `web/outputs/site-source`에서 커밋·푸시했다. 원본 GitHub 저장소는 커밋·푸시하지 않았다.
- 아카이브: `web/outputs/huddlers-fire-torizon-deploy.tar.gz`, 파일 **106개**. 로컬 gzip SHA-256 `fc1559798ead15802ee24bfae7430ce7a98d384b86f536d9cf0ab7fc7f58bb90`, 서비스 tar 해시 `e67c4a9557b3d5762998263bbdfe3cfe0a72a95ab5d43971d8dbb441dd3771e1`. `.env`·Git·node_modules·Wrangler 로컬 상태가 포함되지 않았음을 확인했다.
- 저장 버전: `appgprj_6ae8e9ae42708191b253341387aa287f~appgver_02476340ad5881918691b1094917ed76`, 사용자 버전 **24**.
- 배포: `appgdep_6aec29c283d48191a3e71d82fcb65fab`, **succeeded**, 서버 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . 후속 `get_site`에서도 버전 24·public 접근과 같은 URL을 확인했다. DB·런타임 설정·접근 정책을 변경하지 않았다.
- 공개 확인: `node outputs/check-torizon-deployment.mjs 24` 통과. HTML·공개 방 목록 HTTP 200, JS/CSS·게임 자산·SNS 아이콘·출처 파일 **33개**와 타이머 Worker **1개**가 게시 빌드와 SHA-256으로 일치했다. 번들에서 Torizon 게임/부스 ID, 트레일러 `eDon6CQezQY`, 두 이미지 경로, Steam 본편/데모 ID, YouTube 채널을 확인했다. Discord 준비 상태와 미인증 방 생성 HTTP 401도 확인했다. 공개 방이나 사용자 세션은 만들지 않았다. 결과: `web/outputs/torizon-deployment-check.json`.

단기 소스 인증값은 메모리와 숨겨진 stdin으로 전달했고 전역 설정은 변경하지 않았다. 필요한 저장소 신뢰 설정은 해당 프로세스의 정확한 게시/원본 경로에만 적용했다. 공개 API·파일 검사는 실제 YouTube 스트리밍·실물 모바일 검증을 추가한 것이 아니다. 기존 참가자는 새로고침 후 전시장 포탈로 이동해 새 부스를 볼 수 있다.


## 2026-11-05 컬러·다크 모드 개인 설정 (INT-16, 미배포)

- 사용자 계획 승인에 따라 기본 컬러·선택형 흑백 다크 모드를 설정에 추가했다. UI·세 맵·캐릭터 미리보기·참가자 색 표시·필드/음악 PIP를 같은 개인 설정에 연결했다. 사진·게임 이미지·영상은 원색을 유지하고 공유 상태·DB·규약 v17·물리와 선택 좌표는 변경하지 않았다.
- `npm.cmd test`: **183개 통과**. 테마의 누락/잘못된 값/저장소 제한/복원, 부트스트랩, 세 맵×다섯 불의 컬러→다크→컬러 전환과 프로필 불변성, 양쪽 테마의 이름표 가림/선택을 포함한다. 초기에는 기존 흑백 전용 이름표 검사가 새 컬러 값에 실패해 두 팔레트의 실제 이름표 색을 검사하도록 갱신했다.
- `npm.cmd run typecheck`, `npm.cmd run build`: 최종 소스 통과. `npm.cmd run lint`: 오류 0, 기존 camp-world.mjs의 미사용 COLORS 경고 1개. `git diff --check` 통과. 빌드가 실행 중인 로컬 Worker의 파일 점유로 한 차례 실패해 해당 테스트 서버를 종료하고 다시 빌드했다.
- `npm.cmd run test:render`: 기존 맵·불·캐릭터·동작·이름표 시나리오 통과. 이는 브라우저 화면이 아닌 Canvas 직접 렌더다. campfire-focus.png를 확인해 따뜻한 불·자연색 지형·번호가 있는 컬러 캐릭터와 외부 프로필 이미지 표현을 검토했다.
- 격리 headless Chrome `test:browser:appearance`: 최종 빌드의 데스크톱 1280×900·모바일 390×844 모두 통과. 로비·입장·다섯 탭·설정창 경계/포커스, 테마 즉시 전환, 음량/동의 보존, Canvas와 채팅 초안 유지, 저장 후 새로고침 복원을 검사했다. 초기 테스트 설정에 음량 기본값이 빠진 문제와 hydration 완료 전 클릭하는 타이밍을 보완했다. `web/outputs/seed-settings-color-mobile.png`, `seed-settings-dark-mobile.png`, `seed-lobby-desktop.png` 등의 스크린샷을 직접 확인했다.
- 격리 headless Chrome `test:browser:community`: **통과, 런타임 예외 0**. 열린 필드 PIP의 컬러↔다크 전환 중 같은 창·Canvas·라디오 객체와 방 코드를 유지하고, 음악 PIP에서도 같은 iframe을 유지했다. 포탈 이동·좌석·불 성장·공유 채팅/개인 초안·음소거·음량·방 종료 복귀 등 기존 회귀를 통과했다. 참가자 상세는 비동기 본문 표시까지 기다리도록 검사를 수정했으며 최소 재현에서도 테마 변경 전후 정상 표시를 확인했다. YouTube는 stub API이며 실제 오디오 재생 검증이 아니다.
- 검증 환경은 127.0.0.1:5291의 built Worker와 5292의 격리 SQLite/Discord fixture다. Worker와 headless Chrome은 샌드박스 접근/CDP 제한으로 권한 확장 후 실행했다. 개인 브라우저·데스크톱 UI·외부 공개 서비스는 조작하지 않았다.
- 검증 한계: 실제 Discord OAuth·YouTube 스트리밍·실기기 모바일/키보드·실인터넷 NAT와 커뮤니티 색상 선호는 이번 결과에 포함하지 않는다. 공개 배포·DB 마이그레이션·전역 설정 변경·커밋은 수행하지 않았다.


### 컬러·다크 모드 후속 공개 결과 (2026-11-05, 버전 27·규약 v17)

사용자 “배포해줘” 요청으로 INT-16 검증본을 기존 Sites 프로젝트 appgprj_6ae8e9ae42708191b253341387aa287f에 배포했다. get_site에서 기존 버전 26·public 접근을 확인했다. 공식 source helper로 게시 전용 web/outputs/site-source를 열고 prepare-theme-deploy.mjs에서 소스 189개, 실행 입력 144개가 검증 빌드 이후 변경되지 않았으며 빌드 110개의 SHA-256이 일치함을 확인했다. 기존 성공한 검사들의 입력이 같아 반복하지 않았다.

- 게시 소스 커밋: 2a6eec90ae5d78433fdc47918d903080397c5a68. 공식 helper가 게시 전용 저장소만 커밋·푸시했으며 원본 GitHub 저장소의 미커밋 변경은 유지했다.
- 아카이브: web/outputs/huddlers-fire-theme-deploy.tar.gz, 파일 110개, gzip SHA-256 2decf9b3ff01a4716ce4366e9a1050c3795963a80d2960a36815ececfd26cd2a. Git·의존성·환경 파일·Wrangler 로컬 상태가 포함되지 않음을 확인했다.
- 저장 버전 27: appgprj_6ae8e9ae42708191b253341387aa287f~appgver_f0c4e8b6c544819186b863e5147bad2d.
- 배포 appgdep_6aec5f5c698081918bc95f2549abeaf5: **succeeded**, 환경 리비전 **1**. URL: https://huddlers-fire-camp.gywkd77.chatgpt.site . public 접근·DB·통신 규약 v17·환경 설정을 유지했다.
- node outputs/check-theme-deployment.mjs 27 통과: HTML/공개방 목록 HTTP 200, 기본 light-only 서버 렌더, 두 테마 선택 문구/코드, 공개 자산 36개와 타이머 Worker 1개의 빌드 SHA-256 일치. Discord 준비 상태와 미인증 방 생성 401 확인. 공개 사용자 세션이나 방은 만들지 않았다. 결과: web/outputs/theme-deployment-check.json.

단기 소스 인증은 메모리와 숨겨진 stdin만 사용했고 저장소 신뢰 설정은 해당 명령 환경에만 적용했다. 전역 설정은 변경하지 않았다. 앞선 로컬 검증의 미배포 경계는 이 후속 요청으로 대체하며 실제 미디어 재생·실기기·커뮤니티 선호의 미검증 범위는 유지한다. 기존 사용자는 새로고침 후 설정 → 화면 테마에서 선택할 수 있다.
