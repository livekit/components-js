---
'@livekit/components-core': patch
'@livekit/components-react': patch
---

Surface text and chat stream lifecycle, and stop uncaught `DataStreamError`s. `TextStreamData` (`useTextStream`/`useTranscriptions`) and `ReceivedChatMessage` (`useChat`) now each carry a `status` of `pending`/`complete`/`failed`, with the error exposed on failed entries. Both stream handlers now handle read errors (e.g. a sender disconnecting mid-stream) by surfacing the failure through that `status` — keeping whatever text arrived — instead of letting RxJS rethrow them globally as uncaught exceptions. Every error is treated equally; no error reason is special-cased.
