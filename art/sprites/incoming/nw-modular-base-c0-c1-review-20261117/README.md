# NW common avatar base · C0/C1 review

One static NW body, two hairstyles and two tops. The body is a dressed mannequin for inspecting fit. Curls and the sage hoodie recall Rounded 02. The charcoal bob and plum varsity jacket change the silhouette and the way the neck and shoulders are framed.

- [1× / 2× / 4× comparison](compare-1x-2x-4x.png)
- [Attachment map](attachment-map-4x.png)
- [Camp night, same player position](camp-night.webp)
- [Original and derivative SHA256](REVIEW.json)

## What the existing system supports

The development-only authoring view offers seven slot selectors and three palette selectors. It validates the saved part IDs, stores the selections in browser local storage and preserves the Discord profile-photo setting. Palette IDs only persist as selections. The catalog has zero approved avatar slot entries at the input head, so the existing assembly gate reports no complete production combination. In the previous neutral PNG stack, the skin layer held exposed head/neck pixels, hoodie paint owned the shoulder/arm silhouette, and all hair shared one image and one draw position. Those layers were enough to stage one outfit. Removing the hoodie revealed a missing underlying body and removing hair did not reveal a complete scalp. The production camp still draws its established character and profile photo.

## Swap and occlusion

| Hair | Sage hoodie | Plum varsity |
| --- | --- | --- |
| Curls | Lower locks partly cover the hood lip. The left ear stays visible. | The open neck and contrast collar remain visible below the curls. |
| Bob | The nape sits behind the far shoulder and the front edge clears the near cuff. | The long edge partially covers the far collar. The lighter near collar still reads. |

All four assemblies use the same [base](layer-base.png) and [bottom](layer-bottom-field-trousers.png). Swapping only hair preserves all rows from 48 down. Swapping only the top preserves rows 0–38. All four share the same bottom and boot pixels below row 72. RGBA, alpha values 0/255, byte-exact recomposition and sampled scalp, neck, shoulder, and waist coverage were checked. The bob's edge and jacket sleeves are harder to distinguish under the camp's night lighting than in the 1× neutral background comparison.

- **Mounting:** Each layer uses the existing provisional NW 64×96 canvas and feet/head/seat at (32,88), (32,28), (32,62). The base owns the scalp, ear, neck, fitted mannequin and skin. The tops own collars, shoulders and sleeves. Their hem overlaps the bottom, which owns trousers and boots. Back hair sits beneath the base and clothing. Front hair covers the scalp and only overlaps the top around the nape.
- **Missing parts:** Base-only is a fit diagnostic. The production assembly gate returned no layers for a missing base or unapproved selection. The last campsite panel draws the existing player as a control. No review asset is selected by the production renderer.
- **Future motion:** Each approved part would need the same per-state frame durations and frame anchors. Draw matching parts for each pose before checking collars, waist and hair again. Face, headwear and accessory keep their catalog draw slots. This test has no assets for those slots.

The camp sheet uses the existing local CampRenderer night lighting and scene sort. A local test injects candidate PNGs in the player draw at the same world position. It is a Canvas still, with browser/WebGL/mobile, live customization and network sync untested.

**C0 pending:** Confirm the body proportions and mounting strategy, including the far collar under longer hair. **C1 pending:** Select or request revisions to the base and the four combinations at 1×. C0/C1 precede new breathing poses. The previous G1/G2/G3 motion sequence remains on hold.
