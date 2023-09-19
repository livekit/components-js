# LiveKit Components **Styles**

Beautiful base styling for LiveKit components that you can use as is, build upon, or create your own.

<!--NAV_START-->

## Monorepo Navigation

- [Home](../../README.md)
- **Framework Implementations**:
  - [React](../../packages/react/README.md)
- **Examples**
  - [Next.js](../../examples/nextjs/README.md)
- **Internal Packages**
  - [Core](../../packages/core/README.md)
  - [Styles 👈](../../packages/styles/README.md)

<!--NAV_END-->

### Dev notes

#### Prefix

To avoid collisions CSS all CSS selector used for LiveKit Components (classes, CSS variables, and custom data attributes) are given the same prefix. To avoid typing redundant prefixes and keep the door open for user-defined prefixes, we use PostCSS plugins (see [postcss.config.js](postcss.config.js)) to add the prefix during the build step. This means that you should never write a prefix inside this styles package.

The PostCSS plugins transform the CSS selectors as follows, to make it easier to understand here are a few examples with a prefix of "lk":

| no prefix               | with `lk` prefix           |
| ----------------------- | -------------------------- |
| `.button`               | `.lk-button`               |
| `--border-color`        | `--lk-border-color`        |
| `var(--fg)`             | `var(--lk-fg)`             |
| `[data-active='false']` | `[data-lk-active='false']` |
| `&[data-muted='true']`  | `&[data-lk-muted='true']`  |

#### ⚠️ Currently not supported prefix:

| no prefix                     | with `lk` prefix                 |
| ----------------------------- | -------------------------------- |
| `attr(data-participant-name)` | `attr(data-lk-participant-name)` |

#### `@include` vs `@extend`

> @mixin is used to group css code that has to be reused a no of times. Whereas the @extend is used in SASS to inherit(share) the properties from another css selector. @extend is most useful when the elements are almost same or identical.

The compiled css output would suggest to use `@extend` in cases where css classes should inherit from parent classes (e.g. `.disconnect-button` inherits base properties from `.button`).

```

```
