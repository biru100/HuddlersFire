# NW revised region plan — DRAFT, NOT CONFIRMED

Original pixels, top-left origin. Red rectangles are protected; green is a single connected upper-body region. Entire curly hair is locked (conservative top band), as are shoes, contacts, lower body, position, camera and perspective. The connected neck-below-hair / shoulder / hood / upper-back proposal must be reviewed in ChatGPT; no occluded anatomy is invented.

The user reports ChatGPT accepted this exact f1 as neutral. This does NOT confirm the revised regions/budgets/timing or motion. Do not run confirm-plan before that new review. Draft loop: 4×475ms = 1900ms.

COMPOSITE_MASK.bin is the frozen 0/1 mask (fefef5a715acfaaacd58c98a0a00b9b3e3d58cef1710791b58830d86665b4680), rasterized from the JSON polygons. Composition selects the exact generated RGBA inside, exact anchor outside. No blend, feather, realignment, scale, palette/alpha conversion or redrawing. The inner 4px context collar must already equal f1 in the source; mismatch blocks composition, never gets repaired. Inner collar/core gradient change is also checked.

Generated originals remain generated/; derivatives remain composites/ with independent hashes, change bounds, discarded-source change report, seam report and provenance. A good derivative never certifies the whole supplied source as successful art. Even outside-mask differences are disclosed. Any plan/mask revision requires a new set.
