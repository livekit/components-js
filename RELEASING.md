# Releasing components-js

This repository releases with [verwalter](https://github.com/livekit/verwalter).
The commands that are the same in every repository are in the
[verwalter cheat sheet](https://github.com/livekit/verwalter/blob/main/docs/cheat-sheet.md).
This file holds what is specific to this repository.

## Packages

| Package                       | Tag                                     | Goes to                                                      |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `@livekit/components-core`    | `@livekit/components-core@<version>`    | npm                                                          |
| `@livekit/components-react`   | `@livekit/components-react@<version>`   | npm                                                          |
| `@livekit/components-styles`  | `@livekit/components-styles@<version>`  | npm                                                          |
| `@livekit/components-js-docs` | `@livekit/components-js-docs@<version>` | npm                                                          |
| `@livekit/agents-ui`          | none                                    | Nothing. It is private: only its version and changelog move. |

## Workflows

| File                   | Starts when               | Does                                                                                         |
| ---------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `changeset-check.yaml` | A PR is opened or updated | Fails a PR that changes a package without a changeset. The `internal` label skips the check. |
| `release-pr.yaml`      | A push to `main`          | Keeps the release PR `release/main` current.                                                 |
| `release.yaml`         | The release PR merges     | Tags, creates the GitHub releases, builds, publishes each package to npm, then checks the end state.      |
| `pre-release.yaml`     | Run by hand               | Opens an rc PR into the branch it was run on.                                                |

## Release

1. Merge the release PR.
2. Watch the run of `release.yaml`: `gh run list --workflow release.yaml --limit 1`.
3. A package that npm has never seen is published by hand once. Trusted publishing cannot create it.

A release is complete when:

- each tag of the release PR has a public GitHub release
- npm has each version

The `verify` job of the run asserts both.

## Pre-release

`gh workflow run pre-release.yaml --ref <branch>` opens an rc PR. Merging it publishes
the rc versions under the `next` dist-tag.

## A release failed

Find the cause first. The paths by cause are in the
[recovery section](https://github.com/livekit/verwalter/blob/main/docs/release-workflows.md#recovery).

| Situation                                                | Command                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| A job failed for a transient reason                      | `gh run rerun <run-id> --failed`                                           |
| The workflow file needed a fix, and the fix is on `main` | `gh workflow run release.yaml -f ref=<tag>`                                |
| The released commit is wrong                             | `verwalter release --abandon <tag>`, then a changeset and the next version |

A version that npm has cannot be replaced. Release the next version.

Anyone with write access can start `release.yaml` by hand. Always set `ref` to a tag
of the release, so that the run publishes the tagged source.

## After a release

- The LiveKit docs site reads `@livekit/components-js-docs` from npm.
- `@livekit/agents-ui` is deployed by hand: `pnpm --filter @livekit/agents-ui shadcn:deploy`.

## Who to ask

The code owners in [CODEOWNERS](CODEOWNERS).
