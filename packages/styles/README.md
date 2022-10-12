### Dev notes

#### `@include` vs `@extend`

> @mixin is used to group css code that has to be reused a no of times. Whereas the @extend is used in SASS to inherit(share) the properties from another css selector. @extend is most useful when the elements are almost same or identical.

The compiled css output would suggest to use `@extend` in cases where css classes should inherit from parent classes (e.g. `.disconnect-button` inherits base properties from `.button`).
