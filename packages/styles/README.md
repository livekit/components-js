# LiveKit Components **Styles**

Beautiful base styling for LiveKit components that you can use as is, build upon, or create your own.

<!--NAV_START-->

## Monorepo Navigation

- [Home](/README.md)
- **Docs**
  - [Docs](/docs/alpha-docs/README.md)
  - [Storybook](/docs/storybook/README.md)
- **Framework Implementations**:
  - [React](/packages/react/README.md)
- **Examples**
  - [Next.js](/examples/nextjs/README.md)
- **Internal Packages**
  - [Core](/packages/core/README.md)
  - [Styles 👈](/packages/styles/README.md)

<!--NAV_END-->

### Dev notes

#### `@include` vs `@extend`

> @mixin is used to group css code that has to be reused a no of times. Whereas the @extend is used in SASS to inherit(share) the properties from another css selector. @extend is most useful when the elements are almost same or identical.

The compiled css output would suggest to use `@extend` in cases where css classes should inherit from parent classes (e.g. `.disconnect-button` inherits base properties from `.button`).
