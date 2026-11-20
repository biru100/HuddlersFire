# NW modular avatar · C1 polish review

The 64×96 NW base, anchors, common trousers and boots, and curls/hoodie source layers are reused from the [first modular review](../nw-modular-base-c0-c1-review-20261117/README.md). The curls/hoodie control PNG is byte-identical. This pass changes only the two bob layers and the varsity top as source art. For future editable compositions use the layer stack and exact inputs in [REVIEW.json](REVIEW.json).

- [Bob and varsity before/after at 1× and 4×](parts-before-after.png)
- [Four combinations at 1× and 4×](combinations-1x-4x.png)
- [Same-position night camp comparison](camp-night.webp)

The bob separates the crown, side fringe and nape into larger warm ash-brown locks. The short inner edge leaves the ear and neck visible, while the outer tip breaks the rounded silhouette. The varsity jacket adds full-length sleeves with differentiated light panels, distinct cuffs, a ribbed hem and a lighter far collar. The NW angle shows the collar and construction seams. The front opening is on the hidden side.

| Hair and top | Ear, nape and far collar | Sleeves, hands and waist |
| --- | --- | --- |
| Curls + hoodie | Original ear and hood overlap retained. | Original control. |
| Curls + varsity | Far collar rises into the gap between hair and shoulder. | Cuffs and hem are continuous. Only a small amount of hand remains visible. |
| Bob + hoodie | Short locks leave the ear exposed and the outer tip clears the hood. Dark hair and hood can still read as one edge at night. | Same sleeve and waist pixels as the control. |
| Bob + varsity | There is a neck gap below the short inner locks and a light far-collar edge. That edge is still subtle at night. | Two cuffs and a continuous hem. The far cuff and hand are close in tone under night lighting. |

All four combinations recompose pixel-for-pixel in the existing layer order. The lower rows and foot contact are identical. The sampled scalp, neck, shoulder and waist regions have continuous alpha coverage. The existing draft assembly test rejected unapproved selections and a missing base and preserved the Discord profile-photo setting.

The camp preview uses three stills drawn with the existing local CampRenderer Canvas night lighting, at the same world position and transform. Candidate sprites were injected for these renders. Browser, WebGL, actual devices and multiplayer sync were outside this check.

The working structure is authorized for design iteration. Final C1 judgment remains with the user. Review the bob at 1× for softness, the varsity cuffs for jacket readability, and the separation between dark hair and the far collar at night. Any motion work follows explicit C0/C1 sign-off.
