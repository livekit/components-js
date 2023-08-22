// Copyright (c) LiveKit Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { IDocNodeParameters, DocNode } from '@microsoft/tsdoc';
import { CustomDocNodeKind } from './CustomDocNodeKind';
import { ParameterItem } from './ParameterItem';

/**
 * Constructor parameters for {@link ParameterItem}.
 */
export interface IParametersListParameter extends IDocNodeParameters {}

/**
 * Represents a parameter item like the one passed to a function.
 */
export class ParameterList extends DocNode {
  private _parameterList: ParameterItem[];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IParametersListParameter) {
    super(parameters);
    this._parameterList = [];
  }

  /** @override */
  public get kind(): string {
    return CustomDocNodeKind.ParameterList;
  }

  public addParameter(parameter: ParameterItem): void {
    this._parameterList.push(parameter);
  }

  public getParameters(): ReadonlyArray<ParameterItem> {
    return this._parameterList;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [...this._parameterList];
  }
}
