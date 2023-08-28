// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { IDocNodeParameters, DocNode } from '@microsoft/tsdoc';
import { CustomDocNodeKind } from './CustomDocNodeKind';

interface ITagAttributes {
  [index: string]: string | number | boolean;
}

/**
 * Constructor parameters for {@link MarkDocTag}.
 */
export interface IMarkDocTagParameters extends IDocNodeParameters {
  name: string;
  attributes: ITagAttributes;
  variables: ITagAttributes;
}

/**
 * Represents a section header similar to an HTML `<h1>` or `<h2>` element.
 */
export class MarkDocTag extends DocNode {
  public readonly name: string;
  public readonly attributes: ITagAttributes;
  public readonly variables: ITagAttributes;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IMarkDocTagParameters) {
    super(parameters);
    this.name = parameters.name;
    this.attributes = parameters.attributes;
    this.variables = parameters.variables;
  }

  /** @override */
  public get kind(): string {
    return CustomDocNodeKind.MarkDocTag;
  }
}
