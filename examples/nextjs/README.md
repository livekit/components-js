# LiveKit Components **NextJS Example**

A collection of small examples bundled in a [Next.js](https://nextjs.org/) app. Next.js is just the medium, all the concepts shown should be easily transferable to a framework of your choice.

<!--NAV_START-->

## Monorepo Navigation

- [Home](../../README.md)
- **Framework Implementations**:
  - [React](../../packages/react/README.md)
- **Examples**
  - [Next.js 👈](../../examples/nextjs/README.md)
- **Internal Packages**
  - [Core](../../packages/core/README.md)
  - [Styles](../../packages/styles/README.md)

<!--NAV_END-->

## Setup Examples

To get up and running make sure to first follow the [Setup Monorepo instructions](/README.md#setup-monorepo) the root level of this repository to create all locally linked dependencies within the monoerepo.

Copy the the contents of `.env.example` in to a newly created `.env.local` file and adjust the values accordingly to your livekit server setup.

## Run Examples

With everything setup we can now start the Next.js-App from the root of the monorepo with:

```bash
pnpm dev:next
```

Navigate to `http://localhost:3000/` to see a list of examples to choose from.

## Example Code

The source code of the examples is located in the [pages](./pages/) directory of the Next.js app.
