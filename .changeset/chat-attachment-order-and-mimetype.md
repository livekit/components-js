---
'@livekit/components-core': patch
---

Preserve chat attachment order and MIME type. `setupChat` combined the per-attachment futures with `mergeMap`, which emits as each promise resolves — so `attachedFiles` was ordered by download completion (smallest file first) rather than the order the sender picked them; it now uses `concatMap`, which sequences the emissions of the already-in-flight promises. Received files were also reconstructed as `new File(buffer, fileName)` with no `type`, leaving `File.type` empty — so `ChatEntry`'s `file.type.startsWith('image/')` check could never be true for a received attachment and incoming images rendered as nothing. The byte stream's `mimeType` is now carried through to the `File`.
