# NW Idle breathing: 16 frames, exact F1 pixel lock (review only)

This is a **different candidate** from the unreliable GPT Image 4×4 regenerated sprite sheet. The previously generated 16-frame sheet is **lookdev-only** because head/hair, feet and silhouette drift between the images.

## Inputs (immutable)

- Approved Rounded 02 NW F1 RGBA: \`art/sprites/source-registry/rounded02-idle-frames-nw-03/base/frame01-anchor.png\`, SHA256 \`c1d4bde7cb49cdba5a5221c7d967eb475593780779122279b350d317e2e3b95a\`.
- Prior technical-pass but *unapproved-art* F2: \`art/sprites/incoming/idle-core03-f2-pixel-pilot-20261109/frame02-inhale.png\`, SHA256 \`179f2fd344b45567fd267a94a3b8019c993df68c6de2dc2c87572e9ade321c22\`.
- Frozen CORE03 mask: \`art/sprites/source-registry/rounded02-idle-frames-nw-03/motion-plan/COMPOSITE_MASK.bin\`, SHA256 \`278c2b87052885e70323c3cf6e2b403a993dec31ad5168b5fa85ab814e29a93d\`, 43,422 pixels.

## Authoring logic

- Create **16 source PNGs at exactly 1086×1448 RGBA**, 120ms per frame, seamless **1.92s** breathing study.
- Frame 00 is byte-for-byte F1. Frame 08 is byte-for-byte the previously validated F2. Every intermediate frame is deterministic RGB interpolation between those identical-sized images for changed cloth pixels **inside frozen CORE only**. All outer silhouette, hair, head, hands, pants, shoes, alphas and transparent hidden RGB stay exactly equal to F1.
- Use a smooth sinusoidal cloth cycle, with a tiny line-dependent inhale/exhale timing difference to avoid independent regenerated character frames and snap-back.
- No AI frame regeneration, geometry translation, crop, resize of original 16 frames, alpha conversion, palette quantization of original PNGs, or unapproved art promotion.
- Secondary resized GIF/WebP (when available), and 4×4 montage are **previews** only. The canvas change is applied solely to those differently named preview files, never the approved source files.
- Before output, validate SHA, PNG mode/canvas, source pixel locks, alpha, total changed region and seam. On failure **stop**; do not create replacement images or weaken CORE limits.

## Delivery and review

A dedicated GitHub Actions workflow writes exact frames and previews to:
\`art/sprites/incoming/nw-idle16-fixed-pixel-review-20261109/\`.

Do not register to \`source-registry\` as approved motion, replace any game/runtime art, merge into main or deploy. A technical pass indicates only that the fixed area is stable. **Breathing readability, direction, color smoothness, screen-size quality, final animation and game/Sites deployment require user visual approval.**

This candidate may feel more subtle than the fully generated 16-frame sheet. Prioritize **stable identity and zero locked-pixel drift**, then refine the motion's cloth amplitude only after visually reviewing the loop.
