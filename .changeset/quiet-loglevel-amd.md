---
'@livekit/components-react': patch
---

Fix `TypeError: ...getLogger is not a function` on import in environments with a global AMD loader (`define.amd`). The bundled `loglevel` UMD wrapper now takes its CommonJS branch at build time, as in 2.9.23.
