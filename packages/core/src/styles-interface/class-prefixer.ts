import type { ClassNames as ComponentClasses } from '@livekit/components-styles/dist/types/general/styles.css';
import type { ClassNames as PrefabClasses } from '@livekit/components-styles/dist/types/general/prefabs.css';
import type { UnprefixedClassNames as ComponentNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import type { UnprefixedClassNames as PrefabNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/prefabs.scss';
import { cssPrefix } from './../constants';

type UnprefixedClassNames = ComponentNoPrefixClasses | PrefabNoPrefixClasses;
type Classes = PrefabClasses | ComponentClasses;

/**
 * This function is a type safe way to add a prefix to a HTML class attribute.
 * Only classes defined in the styles module are valid, any other class produces a ts error.
 * @internal
 */
export function prefixClass(unprefixedClassName: UnprefixedClassNames): Classes {
  // @ts-ignore
  return `${cssPrefix}-${unprefixedClassName}`;
}

export function kebabize(str: string) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
}
