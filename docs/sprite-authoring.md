# 장면 명세에서 파일럿 검토까지

## INT-24 픽셀 리소스의 재사용 경로

### 단일 신체 컷 정규화 검수 (2026-11-07)

사용자가 승인한 검수 작업은 원본 1024×1536에서 정확한 1/16 nearest 샘플, alpha 128 기준 이진화, 발 접점을 위한 아래 1px 이동, 결정적 6색 팔레트 초안이다. 원본을 픽셀 격자 정합 원화로 간주하지 않고 raw/binary/palette 파생본을 비교한다. `incoming/body-nw-idle-v1/source.png`를 덮어쓰지 않는다. 새로운 생성 모델은 호출하지 않았다. 이 정규화는 사용자가 요청한 코드 기반 처리이며 일러스트를 자동 픽셀 변환해 완성했다고 판단하는 절차가 아니다.

```powershell
node tools/rebuild-sprites.mjs --normalize art/sprites/pixel-quarterview/incoming/body-nw-idle-v1/normalization.json
```

`tools/lib/pixel-normalize.mjs`가 변환 내역/원본·도구·결과 SHA를 기록한다. recipe는 파싱한 JSON, normalizer 소스는 LF 줄바꿈으로 해시하여 Git의 CRLF 변환으로 증거가 무효화되지 않게 한다. 고정 sprite-gen의 기존 smooth resize는 nearest 축소에 사용하지 않는다. 정규화 후 `slice-sheet`를 **배율 1**의 기하 검사에 사용하고 RGBA가 한 픽셀도 바뀌지 않았음을 확인한다. 원본/명세가 달라지면 새 recipe ID를 사용한다. 이 파생본을 catalog에 등록한 뒤 기존 `--pixel` prepare/build/render 경로를 사용한다.

현재 catalog는 기존 패키지 69개와 NW idle 파생본 1개다(사용 가능 0/보정 24/재생성 40/참고 6). 새 컷의 발은 (32,88), 머리는 **(32,28)**로 측정했으며 전역 제안 (32,18)을 강제로 적용하지 않는다. NW idle의 레이어 계약은 기록했지만 다른 방향/걷기/착석/감정표현은 생성하지 않았다. 재생성·반전·런타임 사용자 교체 없이 test-only actor로 실제 `CampRenderer`의 크기/가림/그림자/기존 벤치 주변을 비교한다. 기본 야간에서 피부 노출이 부족해 생산 승인은 보류다. 기존 공개 버전 40의 캐릭터·사진·온라인 상태는 유지한다.

신규 제작 규격은 `scene-spec.json.pixelQuarterview`, 파일별 판정은 `art/sprites/pixel-quarterview/catalog.json` 하나에서 관리한다. 아래 일러스트 경로는 기존 공개 자산 재현용이다. 패키지 START_HERE와 ART_DIRECTION/HARNESS_IMPLEMENTATION/CUSTOMIZATION_SPEC/ASSET_ISSUES/QA_CHECKLIST를 읽고 이 경로에 통합했다. 패키지 manifest는 출처이며 별도 활성 하네스로 관리하지 않는다.

원본 3장·후보 69개는 `art/sprites/pixel-quarterview/incoming/v0.1/assets/`에 보존한다. `provenance.json`은 원본/ZIP SHA를 기록한다. 네 등급은 `usable_as_is/needs_anchor/needs_redraw/reference_only`이며 초기 패키지 69개만의 분류는 0/23/40/6이다. 파일 검사를 통과해도 미승인 에셋을 프로덕션에 넣지 않는다.

```powershell
# 프로젝트 루트. 항상 새 job 이름을 사용한다.
node tools/prepare-sprite-job.mjs --pixel --out pixel-review-02
node tools/rebuild-sprites.mjs --job art/sprites/runs/pixel-review-02/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/pixel-review-02/job.json
```

출력은 `build/inventory.json`(원본 알파·RGB 가장자리·크기·색 수, 후보별 검사/등급), `manifest.json`, `preview.json`, `REQUEST_MISSING_ASSETS.md`, `screens/`, `review.template.json`이다. `docs/REQUEST_MISSING_ASSETS.md`는 현재 요청서 스냅샷이며 규격을 바꾸면 다시 생성한다. 원본/명세/catalog/렌더 코드가 바뀐 job은 재준비·재검토한다. 임의 리사이즈·반전·블러·색상 보정은 하지 않는다.

```powershell
# web/에서 개발 서버를 실행한다.
$env:CAMP_PREVIEW_JOB='C:/path/to/HuddlersFire/art/sprites/runs/pixel-review-02/job.json'
npm.cmd run dev -- --host 127.0.0.1 --port 5411
# /?pixel=1 : 지정 소품 시험, / : 기존 그래픽
# /__sprite-preview/avatar : 부위/색상 초안, 숨김, 크게 보기, 4방향×4동작 진단
```

기준점 보정 후보인 나무·랜턴·라디오만 개발 필드에 시험 표시한다. 잘못된 시점의 벤치와 불/캐릭터의 부족한 동작은 기존 표현을 유지하고 후보 카드로만 보여 준다. nearest/원점 정렬은 흐림을 줄이지만 원본의 불규칙한 격자를 고치지 못한다. 125/150%에서 균일한 픽셀 폭을 보장하지 않으며 DOM 글자는 일반 텍스트 렌더링을 유지한다. 정수 장치 배율·공통 격자·팔레트는 생산 승인 때 확인한다.

### 다음 ChatGPT 패키지 수신

압축을 새 임시 폴더에 풀고 아래 명령을 실행한다. 포함된 Python 스크립트/모델을 실행하지 않는다. 필수 문서·manifest·PNG 경로와 크기를 확인한 뒤 새 incoming 폴더·`catalog.draft.json`을 만든다. 같은 이름이 있으면 거절하고 원본을 덮어쓰지 않는다. 자동 분류는 모두 참고 전용이며 실제 검토 후에만 승격한다.

```powershell
node tools/import-pixel-package.mjs --source C:/temp/unpacked-package --name v0.2
node tools/prepare-sprite-job.mjs --pixel --catalog art/sprites/pixel-quarterview/incoming/v0.2/catalog.draft.json --out pixel-v02
```

독립 PNG는 새 incoming 폴더에 보존하고 동일 catalog 항목으로 등록한다. `id,file,source,size,kind,slot,status,reason,projection,grid,ground,displaySize,paletteId,collision,variants`를 기록한다. 원본과 후보를 구분하고 모호한 방향·잘린 그림·누락 프레임을 추측해서 채우지 않는다. `collision.authority`는 기존 `camp-maps.mjs`이며 표시 크기로 물리를 바꾸지 않는다.

### 레이어 계약과 저장

선택 구조는 `{version:1,parts:{base,hair,top,bottom,headwear,face,accessory},palettes,profilePhotoMode:'preserve',scope:'local-draft'}`다. 현재 머리 2종/상의 2종을 포함한 선택·저장·복원은 참고 초안이며 승인 조립 조합은 0개다. 정확 RGB 치환표/마스크가 없어 색상 ID는 저장만 하고 원본을 재색칠하지 않는다.

각 catalog 항목의 `variants.NW.idle` 같은 키 아래 `canvas:[w,h],pixelGrid:1,paletteId,frames:[{layers:[{name:'base',rect:[x,y,w,h]}]}],durations:[ms],frameAnchors:[{feet:[x,y],head:[x,y],seat:[x,y]}]`를 둔다. 헤어는 한 프레임 안에 `back_hair/front_hair`를 나눌 수 있다. 모든 부위의 프레임 수·지속시간·캔버스·프레임별 앵커가 같아야 한다. 포즈별 가림은 실제 화면으로 판정한다. 승인 조합만 방향별 반복 재생하며 모자/헤드폰·표정·액세서리도 같은 계약을 따른다.

월드 방향은 NW=(-1,0), NE=(0,-1), SW=(0,1), SE=(1,0)이다. 64×96, 발(32,88)/머리(32,18)/좌면(32,62)은 제작 목표 **제안**이며 원본에서 측정한 승인 값이 아니다. 신체 한 컷을 먼저 검토한 뒤 같은 규격으로 idle/walk/sit_bench/emote를 제작한다. 상태별 요구 수/시간은 scene spec에 있으며 좌우 반전으로 누락을 대체하지 않는다.

### 승인·회귀·온라인 게이트

기존 `review-sprite-job.mjs --job <job.json> --review <review.json>`가 픽셀 job도 검사한다. 모든 필수 Canvas/UI 증거의 해시·관찰, 미해결 0개, 시험 에셋의 사용 가능 판정이 필요하다. 현재 자료는 결함이 있어 생산 승인을 통과할 수 없다. 설치/전체 확장 완료를 주장하지 않는다. 신규 slicing/atlas는 고정 sprite-gen을 무손실/nearest 설정으로 검증한 뒤 기존 경로에 확장한다. v0.1 후보는 검사·바이트 복사로 다루며, 위 단일 컷 정규화는 원본과 분리된 명시적 파생본 제작이다.

`web/`의 기존 `test`, `test:sprites:pipeline`, `test:render`, `typecheck`, `build`를 사용한다. `test:browser:pixel`은 loopback QA 서버를 대상으로 headless 두 브라우저의 초안 복원·Discord 표시·실제 RTC·이동/착석·포탈·채팅/상태·라디오·확대/DPR·Canvas 폴백을 검사한다. OAuth/YouTube는 fixture다. 실행하지 못했거나 실패한 검사는 검증 기록에서 분리한다.

실제 커스터마이징의 온라인 적용은 아직 하지 않는다. 승인 리소스가 준비되면 기존 Member/Player·허용 ID/크기 제한·전송/스냅샷/복구·이전 데이터 fallback을 함께 확장하고 필요하면 규약을 올린다. 새 서버/DB를 임의 도입하거나 사진을 없애지 않는다. 로컬 초안 단계에서 커스터마이징 동기화 완료로 보고하지 않는다.

## 현재 부분 개정 · field-polish-v1

INT-22의 현재 로컬 검토는 `field-polish-v1/release-feedback-v1`이다. 기존 27개 런타임 PNG는 모두 이전 `release-updates-v1`과 SHA-256이 같고 신규 원화/노멀 제작은 없다. `material-spec.json`의 `reviewSet:feedback-v1`이 기존 43개 화면에 상태·자유 시점·착석·다크 UI·라디오·오디오·모바일/PIP 10개를 더해 **53개**를 요구한다. `browser.feedback.mjs`는 두 격리 브라우저의 실제 RTC와 모닥불 파일 decode/output/retry를 검사하고 UI 증거를 추가한다. 이전 검토 폴더는 보존하며 기본 `sprites:build`는 새 로컬 검토를 재현한다. 제품 다크 선택은 컬러 필드를 유지하고 직접 다크 자산 장면은 제작 호환 검사로 구분한다.

INT-21은 같은 원화/노멀의 후속 런타임 검토를 `field-polish-v1/release-updates-v1`에 분리 보존한다. `install-materials.mjs <job-directory> <review.json> [review-revision]`의 선택적 revision을 사용하며 기존 `release`를 덮지 않는다. PNG 제작이나 전체 재생성 승인을 뜻하지 않는다.

INT-20의 현재 명세는 59개 자산이다. **전체 신규 생성이 아닌 명시적 부분 개정**으로, 기존 원본 47개를 해시로 고정하고 12개를 새로 제작했다. 뒤쪽 idle/walk/run 16프레임, 나무/벤치 네 변형과 5종×6프레임 불꽃이 새 범위다. 캐릭터 전체는 83프레임이다. 원본·실제 생성 지시·참조·보정·탈락 이유는 `art/sprites/field-polish-v1/artwork/`에 보존한다. Amber 첫 결과의 외부 얼룩은 탈락 원본을 남기고 내장 이미지 편집으로 제거했다. 생성 API를 다시 부르지 않고 재현할 수 있다.

`prepare-sprite-job.mjs --scope revision --assets <개정 ID 목록> --out <새 작업>`은 전체 명세를 선택하되 나머지를 `reusedSources`로 명시한다. 빌드는 기존 원본 해시가 달라지면 실패하며 예전 manifest로 누락을 채우지 않는다. 전체 신규 생성의 `full` 검토 조건은 그대로다. v1의 부분 미리보기는 선택 밖의 기존 seat bindings도 유지한다.

애니메이션 effect는 명세의 grid·프레임 수·fps를 사용한다. 프레임 전체 실루엣의 공통 bounds와 바닥 앵커로 정규화해 불의 바닥이 흔들리지 않게 한다. 모션 감소는 첫 프레임을 고정한다. 뒤 이동 방향은 manifest의 `locomotionDirections`가 명시할 때만 사용한다.

현재 색상 묶음과 새 크기의 노멀은 `scene-polish-materials` 작업에서 대표 5개 → 전체 43개 WebGL/Canvas/UI 검토 후 `field-polish-v1/release`에 설치했다. 전체 검토에는 추가 프레임 페이지·1/3/8/16명·모바일·방향·불꽃과 기본 PC/모바일 UI가 포함된다. 프레임 페이지 수와 노멀 크기는 manifest에서 파생한다. 기본 `sprites:build`는 이 검토본을 재현한다. 다음 절의 INT-18 v2 제작은 원래 전체 신규 제작 이력이다.

## 기존 그림의 재질 채널 추가

INT-19의 조명 계약은 [lighting.md](lighting.md)를 따른다. 기존 색 원화의 재생성·재패킹과 구분해 `material-spec.json`의 형태 명세에서 노멀 채널을 만든다. 원화·기존 manifest를 동결하고 `tools/build-material-maps.mjs`로 작업 폴더에 출력한다. 기본 원본은 현재 검토 묶음의 `base-manifest.json`이며 새 색 원본을 쓰려면 해당 manifest를 명시한다.

```powershell
node tools/build-material-maps.mjs --out art/sprites/runs/lighting-prototype
# web/에서 개발 서버에만 검토 manifest 주입
$env:CAMP_MATERIAL_PREVIEW='C:/path/to/HuddlersFire/art/sprites/runs/lighting-prototype/manifest.json'
npm.cmd run dev -- --host 127.0.0.1 --port 5193
```

격리 headless `test:browser:lighting`은 대표 장면을 캡처한다. 실제 PNG를 열고 `prototype-review.json`에 관찰·미해결과 현재 fingerprint를 기록한다. `tools/review-materials.mjs <작업 폴더> <prototype-review.json> --scope prototype`으로 정합성을 확인한 뒤 `CAMP_LIGHTING_SCOPE=full`로 전체 동작·맵·복구를 캡처한다. 실제 UI 검사는 `test:browser:lighting:ui`를 **그 뒤 순서대로** 실행해 패널·영상·PIP 증거를 추가한다. 렌더 성공이나 gate 테스트의 합성 fixture로 관찰을 대신하지 않는다.

전체 검토의 `review.json`을 작성한 뒤 아래 명령으로 로컬 설치한다. 화면 캡처 크기·backend·노멀 draw 수, 원본·재질·런타임 해시가 맞아야 한다. 스크린샷만으로 실물 모바일·실제 YouTube 음향까지 확인했다고 보고하지 않는다.

```powershell
node tools/review-materials.mjs art/sprites/runs/lighting-prototype art/sprites/runs/lighting-prototype/review.json
node tools/install-materials.mjs art/sprites/runs/lighting-prototype art/sprites/runs/lighting-prototype/review.json
```

설치는 기존 검토본을 덮어쓰지 않고 버전별 묶음과 `art/sprites/material-release.json`을 남긴다. 승인한 새 묶음을 재현하는 기본 `sprites:build`는 이전 Canvas 전용 필드로 되돌아가지 않는다. 조명 경로가 바뀐 뒤 이전 필드 v2의 화면 검토는 현재 시각 검증을 대신하지 않는다.

## 현재 필드 v2 제작

INT-18의 기본 `scene-spec.json`은 **52개 자산**의 전체 명세다. 동일 사본은 `art/sprites/field-v2/spec.json`, 예전 5개 파일럿은 `examples/composition-pilot-v1.json`에 보존한다. 새 원화는 `field-v2/bootstrap.json`에서 이전 그림을 참조하지 않고 생성했다. 생성 지시·출처·탈락 이유는 `field-v2/*receipts.json`, `corrections.json`, `carry-correction.json`에 남긴다. 그룹 시트의 style/action을 셀 순서에 맞춰 펼친 실제 지시도 보존한다.

`field-v2-spec.mjs`는 목록과 셀 구성의 재현 도구다. `ingest-field-art.mjs <job-dir>`가 고정 sprite-gen으로 grid를 분리한다. v2 앱 어댑터 `tools/lib/field-assets.mjs`는 **빈 manifest에서 시작하며** 이전 이미지·방향·프레임으로 누락을 채우지 않는다. 캐릭터 96px 셀, 시설/효과 192px 셀과 여섯 컬러/여섯 다크 변형을 만든다.

`node tools/prepare-sprite-job.mjs --out new-prototype`는 v2에서 대표 구성에 필요한 부분만 고른다. `--scope pilot`에 전체 자산을 지정해 원형 검토를 우회할 수 없다. 전체 제작은 `--scope full --review-job <원형 job.json> --review <원형 review.json>`으로 명시한다.

원형은 전체 명세에서 시설·효과·지형과 idle/sit/네 착석 방향을 선택한다. 전체 준비에는 같은 명세의 원형 Canvas/UI 검토가 필요하며 전체 선택에서 자산 하나라도 빠지면 거절한다. 전체 검토에는 동작·16인 연쇄가 추가되고 PC/모바일의 필드와 열린 대화를 각각 캡처한다.

머리 색 검출은 **초안 측정**이다. `freeze-field-anchors.mjs <job.json>`으로 프레임별 원형 머리 중심·반경을 `annotations.json`에 고정하고 다시 빌드한다. 모든 프레임·혼합 자세와 실제 장면을 열어 확인한 뒤 검토한다. 손을 머리로 오인하거나 흰 셀 배경이 남으면 통과시키지 않는다. 설치에는 고정 앵커와 검토 증거가 모두 필요하다.

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/field-v2-full/job.json
node tools/freeze-field-anchors.mjs art/sprites/runs/field-v2-full/job.json
node web/scripts/build-sprite-assets.mjs --job art/sprites/runs/field-v2-full/job.json
node web/tests/render-field-frames.mjs art/sprites/runs/field-v2-full/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/field-v2-full/job.json
# 격리 UI 검토·review.json 완료 후 로컬 앱에 설치
node tools/install-field.mjs art/sprites/runs/field-v2-full/job.json art/sprites/runs/field-v2-full/review.json
```

원본을 재생성하면 해당 고정 앵커도 재측정·검토한다. 이전 원본은 보존하며 설치는 배포가 아니다. 아래 v1 경로의 이전 자산 fallback·ungraded 설명은 예제 파일럿에만 적용한다.

최종 검토 묶음은 `field-v2/release/`에 원본·명세·프롬프트·앵커·검토·증거와 함께 보존한다. 기본 `npm.cmd run sprites:build`는 이 묶음을 새 작업 폴더에 재현하고 해시·현재 런타임 검토를 다시 확인한다. 원본이나 런타임이 바뀌면 오래된 검토로 설치하지 않는다. INT-17 재패킹은 명시적인 `node tools/rebuild-sprites.mjs --legacy`로만 실행한다. 기본 명령이 이전 그림을 복구하지 않도록 구분한다. 재생 중 영상이 있는 PC/모바일 증거도 전체 설치의 필수 조건이다.

## v1 파일럿 경로 (이력)

새 생성의 입력은 `art/sprites/scene-spec.json`이다. 표현·참조·필요한 상태/방향·정규화 접촉점·깊이·기존 맵 ID 연결·검토 장면을 한곳에서 정한다. `camper-request.json`은 기존 63프레임 원본의 재패킹 계약으로 유지한다. 새 작업의 상태 요청은 명세에서 작업 폴더의 `request.json`으로 파생한다. 생성된 manifest 좌표를 직접 고치지 않는다.

## 작업 준비

프로젝트 루트에서 실행한다. `--out`은 `art/sprites/runs/` 아래의 새 폴더 이름이며 기존 폴더를 덮어쓰지 않는다.

```powershell
node tools/prepare-sprite-job.mjs --out my-pilot --assets camper-idle,camper-sit,bench-ne,bench-nw,grass
```

출력은 명세 스냅샷·해시·선택 목록·참조 이미지 해시를 담은 `job.json`, 자산별 `prompts/*.txt`, `request.json`, 미검토 상태의 `review.template.json`이다. 명세의 기준을 바꾸려면 새 작업을 준비한다. 기존 작업의 프롬프트나 참조가 바뀌면 빌드를 거절한다.

현재 기본 명세의 5개 자산은 구성 경로 검증용 파일럿 목록이다. `--scope full`은 선언된 명세의 신규 제작 범위이며 앱의 모든 자산을 자동 수집하지 않는다. 실제 전면 재생성 때는 필요한 동작·시설·효과·맵/테마 범위를 빠짐없이 정의한 명세를 먼저 만들고, 그 명세에서 대표 부분을 선택해 검토한다. 5개 파일럿만으로 전체 앱 재생성이 준비됐다고 보고하지 않는다.

`imagegen` 스킬의 내장 도구에 해당 프롬프트와 참조 이미지를 전달한다. 결과를 `<작업>/source/<자산 ID>.png`에 복사하고 원본·프롬프트·출처를 프로젝트 안에 보존한다. 외부 사진/공식 게임 이미지는 입력으로 보내지 않는다. 아래 명령들은 생성 API를 호출하지 않는다.

## 부분 제작과 실제 합성

```powershell
node tools/rebuild-sprites.mjs --job art/sprites/runs/my-pilot/job.json
node web/tests/render-scene-preview.mjs --job art/sprites/runs/my-pilot/job.json
```

선택한 원본만 고정 sprite-gen의 `slice-sheet`로 처리하고, 지형은 `background-tile`의 x/y 처리를 추가한다. 앱 어댑터가 별도 manifest를 만든다. 단일 프레임 파일럿에도 공식 도구를 사용하며 기존 전체 `extract/compose-atlas` 재패킹 경로와 구분한다. 기존 원본·`web/public/sprites/`·정식 JS manifest는 쓰지 않는다.

접촉점과 머리 위치는 투명 영역을 제외한 실루엣에 대한 0~1 좌표다. 실제 화면을 보고 측정한 보정은 작업의 `annotations.json`에 선택한 자산의 `contacts`/`head`만 기록한다. 색으로 머리를 추측하는 것을 새 자산의 최종 계약으로 삼지 않는다. 보정도 빌드 해시에 포함하므로 이전 검토 결과는 재사용할 수 없다.

미리보기는 정식 `CampRenderer`에 별도 manifest·로더·캐시를 주입한다. 명세에서 선택하지 않은 부분은 기존 자산을 사용하며 evidence에 구분한다. 파일럿 색/다크 변형은 제작하지 않은 상태임을 `ungraded`로 표시한다. 이를 6색·다크 전체 제작 검증으로 보고하지 않는다. 신규 방향을 요청했는데 없으면 다른 그림으로 몰래 대체하지 않고 실패한다.

## 전체 UI 확인

별도 터미널에서 `web/`을 기준으로 아래와 같이 개발 서버를 띄운다. `CAMP_PREVIEW_JOB`에는 작업의 절대 경로를 지정한다. 작업을 다시 빌드한 뒤에는 개발 서버도 다시 시작한다.

```powershell
$env:CAMP_PREVIEW_JOB='C:/path/to/HuddlersFire/art/sprites/runs/my-pilot/job.json'
npm.cmd run dev -- --host 127.0.0.1
```

기존 loopback QA API 서버의 `CAMP_QA_UPSTREAM`을 위 서버에 연결한 뒤, 같은 `CAMP_PREVIEW_JOB` 환경으로 `node tests/browser.appearance.mjs`를 실행한다. 임시 headless 프로필만 사용한다. 개발 전용 플러그인이 메모리에서 자산 manifest를 교체하고 파일을 공급한다. UI 검사는 서버/manifest 해시와 실제 이미지 요청을 확인한 뒤 PC·모바일 캡처를 evidence에 추가한다. 플러그인은 production build에서 활성화되지 않는다. 기본 앱에 미리보기 URL·인증 우회·사용자 조작 메뉴를 추가하지 않는다.

## 검토와 전체 제작으로의 확대

실제 PNG를 열어 [장면 구성 기준](scene-composition.md)으로 평가한다. `review.template.json`을 별도 `review.json`으로 복사한 뒤 검토자·현재 fingerprint와 manifestHash·각 장면의 pass/fail와 구체적 관찰·미해결을 기록한다. 도구가 이미지의 미감을 자동 판정하는 것은 아니다.

```powershell
node tools/review-sprite-job.mjs --job art/sprites/runs/my-pilot/job.json --review art/sprites/runs/my-pilot/review.json
node tools/prepare-sprite-job.mjs --scope full --out full-job --review-job art/sprites/runs/my-pilot/job.json --review art/sprites/runs/my-pilot/review.json
```

전체 신규 생성 작업 준비에는 같은 명세의 검토 완료 파일럿이 필요하다. 누락/실패/미해결, 변경된 원본·보정·참조·프롬프트·manifest·런타임, 다른 크기의 PNG, 오래된 이미지 해시는 거절한다. 이 검사는 근거의 정합성을 확인하며 관찰 내용의 진실성이나 취향을 자동 보증하지 않는다. 사용자 승인 단계를 새로 추가한 것이 아니며 실제 생성·적용·배포 권한은 현재 요청 범위를 따른다.

기존 원본을 그대로 재패킹하는 `node tools/rebuild-sprites.mjs`에는 새 생성의 검토 절차를 강제하지 않는다. 작은 작업은 별도 `--spec`에서 관련 자산과 검토 장면만 정한다. 전면 재구성에 필요한 세 맵·방향별 착석·실제 UI 범위를 작은 수정에 일괄 적용하지 않는다.
