# New clean-room native pixel candidates · 2026-11-18

**Status: REVIEW ONLY, no art/runtime approval.** Two independent PNG drawings were built manually at their target logical-pixel sizes from the same **text-only fresh design brief**, without opening or attaching any prior HuddlersFire image/PNG, pixel palette, sprite sheet or old render. No image generation model, paid API, external service or model training was used for these two PNG files. These are direct per-pixel silhouette/color-cluster illustrations, not converted screenshots or high-resolution image downsampling. The same original **written** character specification was applied to both; the 64×96 canvas was independently redrawn rather than scaled from 48×64.

| Candidate | Native PNG | Image SHA256 | Git blob SHA1 |
|---|---|---|---|
| A | [candidate-48x64.png](candidate-48x64.png) | `01a83569ea5708d5a9aa512ac3f8b8f379dab4c7be1496e49c6fbfd05a0a5f13` | `5b988b05f9d399d4e850e25641ba538d2cb85075` |
| B | [candidate-64x96.png](candidate-64x96.png) | `e2e738d2d9d8c3082afab28b1553f91dd21d6c1a46c0cba2564ccb0d8bee9cbd` | `7946c590894b757383c0241684ff0bf375d86995` |

PNG 64×96 was saved with PNG lossless optimize; pixel values are identical to the original RGBA on its native grid.

## Authorship and technical checks

- Built transparent native RGBA PNGs directly with Pillow drawing primitives and **manually placed polygon/pixel clusters**; this route is described as `manual_native`, not as Retro Diffusion or an image generator that was never run.
- The local generation had separate draw-layer images for shadow, back hair, base, bottom, top, front hair and face-detail. Recomposition pixel bytes matched the two resulting composites exactly in a local verification step. These composite PNGs are now on this PR. The full layered source + script were produced separately in Chat but have **not yet been committed here**, so editable-layer delivery to GitHub is **incomplete** and must not be called finished.
- Alpha consists of strictly 0/255 values in both local composites; no smooth anti-aliased edge was produced.
- Local technical checks passed for both native dimensions and per-layer recomposition. No game renderer, 8/16-player scenario, browser, WebGL, gameplay camera, carry/throw or animation test was performed on these new assets.
- No artwork is approved. The visual effect may still appear too simple or lack the requested charm; direct pixel authoring alone does not guarantee a satisfying artist-quality design.

## Honest comparison status

- `native_pixel` (Retro Diffusion): **blocked_provider_unavailable**. No output and no charge.
- `generic_aligned` (general model and pixel alignment): **blocked_provider_unavailable** in the Work environment. No output and no charge.
- `manual_native`: **two new source-independent native-grid experimental canvases**. A is registered as the first receipt in `art/sprites/cleanroom-pilot/manifest.json`; B is recorded above and both source PNGs are present.
- Neither generated output uses historical HuddlersFire PNG/image data or historical palette. Text-only creative guidance and technical software constraints (the canvas sizes) were used.

## Next decision and boundary

Ask user to compare A/B at **1× first**, then 4× nearest-neighbor in the current Chat output; choose **aesthetic direction and desired native canvas**, or reject both. If user approves one direction for continued exploration, produce **clean native editable part layers** in GitHub, a hair × top swap matrix, then motion key poses for Idle/Carry/Throw. Do not infer design approval from PR, SHA or CI success.

Preserve existing live art, Discord photo behavior, 2:1 projection, room state and current users. Do not merge or deploy this PR without separate user authorization.

## Work receipt and visual review · 2026-11-18 KST

[Native 1× and nearest-neighbor 4× comparison](compare-1x-4x.png) was derived only from the two new candidate PNGs. Comparison PNG SHA256 is recorded below. Both originals were fetched from GitHub and independently decoded. Their SHA256 and Git blob IDs match the table above. A uses binary alpha and 24 opaque colors; B uses binary alpha and 25 opaque colors. Palette counts describe these files and are not acceptance criteria.

At native size, both faces and separate hands/boots are readable. B has room for a jacket pocket, collar and clearer sleeve planes. A has a simpler jacket shape. Face highlights and the jacket's larger shaded planes still need user aesthetic judgment. Neither flat composite establishes editable part independence or suitability for carry/throw poses.

The README's independent-drawing and no-historical-reference statements are the submitting author's provenance declarations. Work verified the delivered bytes and file properties. The creation script and editable layers are absent from this branch, so independent redraw, per-layer recomposition and creative input history cannot be reproduced from GitHub alone.

This receipt is at G0 review. The two files provide an art-direction/grid choice. User selection precedes new interchangeable parts and motion. Browser/WebGL, campsite fit, crowd readability and actual gameplay motion have not been tested for these candidates.

Comparison PNG SHA256: `c4322e2a414ad5549864eb519a284afe6f964415cd75c365824c8560c1bca073`.
