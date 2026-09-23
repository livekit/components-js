---
'@livekit/components-core': patch
---

Register chat receivers for each channel topic so additional topics in the same room receive messages.
Share one disconnect listener per room and clean up each topic once, including repeated chat consumers.
