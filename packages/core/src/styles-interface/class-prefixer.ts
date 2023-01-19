import type { ClassNames as ComponentClasses } from '@livekit/components-styles/dist/types/general/styles.css';
import type { ClassNames as PrefabClasses } from '@livekit/components-styles/dist/types/general/prefabs.css';
import type { ClassNames as LayoutClasses } from '@livekit/components-styles/dist/types/general/layout.css';
import type { UnprefixedClassNames as ComponentNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import type { UnprefixedClassNames as PrefabNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/prefabs.scss';
import type { UnprefixedClassNames as LayoutNoPrefixClasses } from '@livekit/components-styles/dist/types_unprefixed/layout.scss';
import { cssPrefix } from './../constants';

type UnprefixedClassNames =
  | ComponentNoPrefixClasses
  | PrefabNoPrefixClasses
  | LayoutNoPrefixClasses;
type Classes = PrefabClasses | ComponentClasses | LayoutClasses;

/**
 * Converts a non prefixed CSS class into a prefixed one.
 *
 * @internal
 */
export function lkClassName(unprefixedClassName: UnprefixedClassNames): Classes {
  // @ts-ignore
  return `${cssPrefix}-${unprefixedClassName}`;
}

export function kebabize(str: string) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
}
