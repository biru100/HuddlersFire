# 장면 명세에서 파일럿 검토까지

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
