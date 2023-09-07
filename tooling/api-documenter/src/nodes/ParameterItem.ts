// Copyright (c) LiveKit. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { IDocNodeParameters, DocNode, DocBlock } from '@microsoft/tsdoc';
import { CustomDocNodeKind } from './CustomDocNodeKind';

/**
 * Constructor parameters for {@link ParameterItem}.
 */
export interface IParametersItemParameters extends IDocNodeParameters {
  attributes: IAttributes;
}
interface IAttributes {
  name: string;
  type: string;
  optional: boolean;
  description: readonly DocNode[];
  deprecated?: readonly DocNode[];
}

/**
 * Represents a parameter item like the one passed to a function or the once in a component property object.
 */
export class ParameterItem extends DocNode {
  public readonly attributes: IAttributes;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IParametersItemParameters) {
    super(parameters);
    this.attributes = parameters.attributes;
  }

  /** @override */
  public get kind(): string {
    return CustomDocNodeKind.ParameterItem;
  }
}
