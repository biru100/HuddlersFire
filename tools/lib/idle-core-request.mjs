// Input contract for a new, explicitly reviewed anchor-guard plan. Legacy prompts stay byte-identical.
export function coreFrameRequest(job,frame){
  return {
    workflow:'anchor-frame-by-frame',delivery:'upper-body-partial-on-full-original-canvas',
    view:job.view,frame:frame.id,intent:frame.intent,
    anchor:{file:'base/frame01-anchor.png',sha256:job.anchorSha256,canvas:job.canvas},
    lockedPlanSha256:job.planSha256,frameIntentSha256:job.intentSha256,
    maskSha256:job.composition.maskSha256,
    attach:['base/frame01-anchor.png','motion-plan/REGION_LOCKS.md','motion-plan/REGION_LOCKS.json','motion-plan/FRAME_INTENT.json'],
    output:{filename:frame.file.split('/').at(-1),format:'single-frame RGBA PNG, source only',canvas:job.canvas,background:'transparent',sheet:false},
    composition:{...job.composition,guardSource:'anchor',guardBandPx:job.regionComposition.guardBandPx,
      rule:'Frozen COMPOSITE_MASK.bin selects editable CORE only. Every guard/outside RGBA pixel comes from f1. No resizing, alignment, blending, feathering, recoloring or redrawing.',
      sourceScope:'Preserve every raw source byte. Disclose discarded guard/outside changes. The composite is a separately hashed derivative, not proof of a pixel-exact generator.'},
    locked:['entire head, hair, face and neck','both entire shoes and individual contacts','lower body','hands, sleeve cuffs and outer sleeve silhouettes','global position and camera'],
    limitedMotion:['small connected interior hood and upper-back cloth response; no invented front chest'],
    rules:[
      'Create this one frame from the same approved f1, never from a previously generated frame.',
      'Use tiny changes to existing hood/back folds and shading; do not move the entire torso or shoulders.',
      'Do not generate a 2x2 sheet, extra character, label, background, feet movement or new costume details.',
      'Preserve the exact original canvas when supported. A mismatched output is kept as a blocked source, never forcibly resized.',
      'Core/anchor seam continuity is still required. The predeclared fixed guard uses anchor pixels; source guard differences are disclosed, not silently counted as a source PASS.',
      'The 1900ms loop is a review hypothesis. All motion, native and runtime approvals remain pending.'
    ],
    roles:{artworkAndArtReview:'ChatGPT',technicalAndAssembly:'ChatGPT tools or Codex; same checks',finalMotionSelection:'user'},
    reviewState:'pending-motion-review',decision:'pending',artApproved:false,animationApproved:false,productionReady:false,runtimeVerified:false
  };
}
export function coreFrameRequestText(request){
  const intentions={f2:'작은 들숨: 기존 후드와 등 위 옷감의 주름이 아주 미세하게 펴지는 상태',f3:'부드러운 날숨: 들숨의 반대 극점으로 튀지 않고 중립에 가까워지는 상태',f4:'중립 복귀: f1에 가까운 작은 잔여 변화, 4→1에서 형태가 튀지 않는 상태'};
  return `HuddlersFire ${request.view.toUpperCase()} ${request.frame} 단독 원화: ${intentions[request.frame]}\n\n승인된 f1 실제 PNG를 유일한 기준으로 사용합니다. 밤갈색 곱슬머리, 세이지 후드, 차콜 브라운 바지, 갈색 신발과 원래 비율을 유지합니다. NW는 눈이 보이지 않는 뒷사선입니다.\n머리/얼굴/목/하체/신발/손/소매 끝/전체 위치는 고정합니다. 허용된 후드·등 내부의 작은 주름·명암 변화만 그리세요. 어깨 외곽이나 소매 전체를 다시 디자인하지 마세요.\n프레임 한 장만, 동일한 원본 캔버스와 투명 RGBA PNG로 제공합니다. 생성기의 실제 출력 크기를 보고하며 강제 변환하지 않습니다. 전체 시트·자동 반전·알파 이진화·양자화·코드 재작화는 하지 않습니다.\n사전에 고정한 CORE 안의 픽셀만 합성에 사용합니다. 경계 띠와 그 밖은 f1에서 가져옵니다. 원본 경계가 동일하지 않아도 변경 내역을 보고하며, 합성의 CORE 경계 이음새가 어긋나면 차단합니다. 생성 원본과 파생 결과는 별도로 보존합니다.\n1900ms 루프는 미술 검토용 가설입니다. 이번 제작·기술 확인은 사용자 모션 승인이나 게임 적용/배포 승인이 아닙니다.\n\n${JSON.stringify(request,null,2)}\n`;
}
export function coreRegionNotes(job){
  return `# ${job.view.toUpperCase()} Idle plan 03: fixed anchor guard\n\nOriginal-canvas coordinates; no anatomical claims inferred from rectangular proxies. Head/hair/face/neck, lower body, shoes, hands and sleeve outlines stay fixed. The connected central hood/back region is only an editing envelope. Its ${job.regionComposition.guardBandPx}px inner collar is excluded from generated art.\n\nCOMPOSITE_MASK.bin is the frozen CORE selection mask, SHA256 ${job.composition.maskSha256}. A selected pixel uses generated RGBA exactly; every other pixel, including the guard, uses anchor RGBA exactly. Source guard/outside differences are preserved in the raw PNG and reported separately. The inner seam and region-change budgets still block unsuitable composites. No blending, feathering, automatic positioning, resizing, quantization or redrawing.\n\nThe source is not declared fully pixel-locked merely because the derivative is stable. Existing plan01/02 prompts and sources stay unchanged. Plan confirmation authorizes this experiment only; user motion approval/native/runtime/deployment remain separate.\n`;
}
