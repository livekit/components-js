---
'@livekit/components-core': minor
'@livekit/components-react': patch
---

Surface text and chat stream lifecycle, and stop uncaught `DataStreamError`s. `TextStreamData` (`useTextStream`/`useTranscriptions`) and `ReceivedChatMessage` (`useChat`) now each carry a `status` (`TextStreamStatus`: `Streaming`/`Complete`/`Failed`), with the error exposed on failed entries.
