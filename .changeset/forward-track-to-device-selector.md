---
'@livekit/components-react': patch
---

Forward the local `track` to `setupDeviceSelector` in `useMediaDeviceSelect` so `setActiveMediaDevice` switches the microphone or camera in pre-join / preview mode (no connected room).
