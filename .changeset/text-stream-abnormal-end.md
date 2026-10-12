---
'@livekit/components-core': patch
---

Handle chat and text streams that end abnormally, for example when the sending participant disconnects mid-stream. Text streams keep the accumulated text and log at debug instead of letting RxJS rethrow the error globally. A chat message whose attachment stream fails now settles instead of hanging, without an unhandled rejection, and a message still waiting on attachments ends when its sender leaves or the local room disconnects.
