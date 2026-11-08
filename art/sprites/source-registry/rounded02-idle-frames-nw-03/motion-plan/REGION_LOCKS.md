# NW Idle plan 03: fixed anchor guard

Original-canvas coordinates; no anatomical claims inferred from rectangular proxies. Head/hair/face/neck, lower body, shoes, hands and sleeve outlines stay fixed. The connected central hood/back region is only an editing envelope. Its 4px inner collar is excluded from generated art.

COMPOSITE_MASK.bin is the frozen CORE selection mask, SHA256 278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d. A selected pixel uses generated RGBA exactly; every other pixel, including the guard, uses anchor RGBA exactly. Source guard/outside differences are preserved in the raw PNG and reported separately. The inner seam and region-change budgets still block unsuitable composites. No blending, feathering, automatic positioning, resizing, quantization or redrawing.

The source is not declared fully pixel-locked merely because the derivative is stable. Existing plan01/02 prompts and sources stay unchanged. Plan confirmation authorizes this experiment only; user motion approval/native/runtime/deployment remain separate.
