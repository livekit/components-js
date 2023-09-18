import type { UnprefixedClassNames as ComponentNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/index.scss';
import type { UnprefixedClassNames as PrefabNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/prefabs/index.scss';
import { cssPrefix } from './../constants';

type UnprefixedClassNames = ComponentNoPrefixClasses | PrefabNoPrefixClasses;

/**
 * This function is a type safe way to add a prefix to a HTML class attribute.
 * Only classes defined in the styles module are valid, any other class produces a ts error.
 * @internal
 */
export function prefixClass<T extends UnprefixedClassNames>(unprefixedClassName: T) {
  return `${cssPrefix}-${unprefixedClassName}` as const;
}
