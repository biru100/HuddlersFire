# Chat-generated resource batches for Work (no paid image API)

This is the general **Chat → GitHub → Work → existing GPT Sites** resource handoff.
Keep the older strict \`chat-image-handoff\` folder for the existing NW CORE03 individual F2/F3/F4 job only.

One Chat batch can include multiple characters, props, backgrounds, animation-frame PNGs or a **single 2x2 / 3x3 motion concept sheet**. A sheet is ONE unchanged source, not several verified independent final frames. Work may create tracked DERIVED sprite tiles, previews or game-size pixel resources after checking the actual game art requirements; it never silently rewrites the Chat original.

## Layout

    art/sprites/incoming/chat-asset-batches/<unique-batch-id>/
      manifest.json
      originals/
        idle-sheet.png
        camp-prop.png
        background.png

manifest.json example (replace every example field with actual values):

    {
      "version": 1,
      "kind": "chat-asset-batch",
      "batchId": "camp-art-set-001",
      "repository": "biru100/HuddlersFire",
      "sourceReference": "ACTUAL_CHAT_GENERATION_MESSAGE_OR_TRACEABLE_REFERENCE",
      "observedModel": "unverified",
      "target": "Camp character idle lookdev and prop preview",
      "artApproved": false,
      "productionReady": false,
      "runtimeVerified": false,
      "assets": [
        {
          "id": "idle-sheet",
          "file": "originals/idle-sheet.png",
          "type": "animation-sheet",
          "role": "reference",
          "description": "2x2 chibi idle motion concept",
          "sha256": null
        },
        {
          "id": "camp-prop",
          "file": "originals/camp-prop.png",
          "type": "prop",
          "role": "candidate",
          "description": "Camp prop concept for scene integration review",
          "sha256": null
        }
      ]
    }

Allowed types: character, animation-sheet, animation-frame, background, prop, ui, costume, reference, other.
Roles: reference or candidate; neither is automatic art approval.

**Binary transfer rule:** GitHub must actually contain the unmodified PNG files. Chat should upload directly when its connected tool can handle the real binary/base64 bytes and verify GitHub SHA256. Some Chat GitHub connections only expose text or base64-string Git operations and do not accept Chat file references; DO NOT claim this bridge works without testing it. In that case the user uploads the exact PNG files **once** using GitHub's file uploader, and Chat can provide/commit the manifest and guide Work. No JSON-only or hash-only success, no new paid image API or service.

The read-only validator is \`node tools/chat-asset-batch.mjs inspect outputs/chat-asset-batch-report.json\`. It accepts real PNG RGB8/RGBA8 at their **original generated dimensions**, verifies binary structure/CRC/decompression and hashes. Unlike the strict CORE03 F2 validator, it **does not** require 1086x1448 or an F1 pixel lock. It never crops/resizes/normalizes the originals. Art acceptance and Sites deployment are downstream, independent approvals.

When GitHub PR receives the batch, the existing Work PR automation picks it up, audits GitHub actual bytes and CI, creates derived assets with provenance and previews, tests integration, requests approval when necessary, and saves/publishes a reviewed version using only the existing GPT Sites project. No new site, D1 or URL.
