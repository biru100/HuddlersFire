# Chat → GitHub binary bridge proof (reference-only)

**Purpose:** verify raw-file transfer and GitHub/Work handoff, not image quality or animation approval.

- Original source: prior Chat image-generation PNG (not a valid F2).
- Exact input bytes: 485070.
- Original SHA256: `918d0f2dc2c6fed827c52d346307bd2a9eb12a2d844e2bc06f6a0b4dc4e08a5f`.
- Expected full Git blob SHA1: `285d5d6f4d84b964b5348fefefae0c218e653367`.
- File dimensions: 1055x1491 RGBA. This is intentionally **not** accepted by the 1086x1448 CORE03 frame contract.
- Chat source was turned into an **internal temporary Base64 text transport**, then read by file tooling and supplied as binary to the GitHub blob endpoint; no resampling or re-encoding of the original PNG.
- The binary blob SHA matches the local Git SHA expected from original bytes.
- The separate batch validator must independently verify actual remote PNG CRC, zlib scanlines and SHA256.
- This isolated draft PR is a test-only handoff for the existing Work PR automation. No runtime integration, no art approval, no Sites save or publish.
