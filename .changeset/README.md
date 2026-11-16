# Changesets

This repository releases with [verwalter](https://github.com/livekit/verwalter).
A PR that changes a published package needs a changeset file in this folder:

```md
---
'@livekit/components-react': patch
---

One sentence for the user of the package.
```

`verwalter changeset --level patch` writes one. A PR that needs no release takes the `internal` label.
