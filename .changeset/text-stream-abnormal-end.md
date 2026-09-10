---
'@livekit/components-core': patch
---

Handle text streams that end abnormally (e.g. the sending participant disconnects mid-stream): keep the accumulated text and log at debug instead of letting RxJS rethrow the DataStreamError globally as an uncaught exception.
