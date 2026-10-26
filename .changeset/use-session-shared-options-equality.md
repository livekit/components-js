---
'@livekit/components-react': patch
---

Use `areTokenSourceFetchOptionsEqual` from `livekit-client` in `useSession` instead of a local copy, so the token fetch options comparison stays in sync with the SDK
