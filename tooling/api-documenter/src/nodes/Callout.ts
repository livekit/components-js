// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { IDocNodeParameters, DocNode, DocSection } from '@microsoft/tsdoc';
import { CustomDocNodeKind } from './CustomDocNodeKind';

type CalloutType = 'note' | 'tip' | 'important' | 'caution' | 'warning';
type CalloutVariant = 'normal' | 'compact';

/**
 * Constructor parameters for {@link Callout}.
 */
export interface ICalloutParameters extends IDocNodeParameters {
  type?: CalloutType;
  variant?: CalloutVariant;
}

/**
 * Represents a note box, which is typically displayed as a bordered box containing informational text.
 */
export class Callout extends DocNode {
  public readonly type: CalloutType;
  public readonly variant: CalloutVariant;
  public readonly content: DocSection;

  public constructor(parameters: ICalloutParameters, sectionChildNodes?: ReadonlyArray<DocNode>) {
    super(parameters);
    this.content = new DocSection({ configuration: this.configuration }, sectionChildNodes);
    this.type = parameters.type ?? 'note';
    this.variant = parameters.variant ?? 'normal';
  }

  /** @override */
  public get kind(): string {
    return CustomDocNodeKind.Callout;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.content];
  }
}
