---
'@livekit/components-core': patch
'@livekit/components-react': patch
---

Require `livekit-client >= 2.20.1`. That release ships the `NonSharedUint8Array`
type declaration in its published types; earlier 2.19/2.20.0 builds referenced it
without shipping it, which broke type resolution for consumers (`skipLibCheck: false`)
and API Extractor. The local workaround shim is removed now that the type resolves
from livekit-client itself.
