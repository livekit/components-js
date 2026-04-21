---
'@livekit/components-react': patch
---

Fix `useKrispNoiseFilter` throwing `InvalidAccessError` on the second session when `Room.disconnect()` + reconnect republishes the microphone. The hook now treats `LocalAudioTrack.getProcessor()` as the source of truth and creates a fresh `KrispNoiseFilterProcessor` per track, avoiding reuse of a processor whose internal audio graph is bound to a now-closed `AudioContext`.
