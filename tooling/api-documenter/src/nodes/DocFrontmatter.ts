// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { IDocNodeParameters, DocNode } from '@microsoft/tsdoc';
import { CustomDocNodeKind } from './CustomDocNodeKind';

/**
 * Constructor parameters for {@link DocFrontmatter}.
 */
export interface IDocFrontmatterParameters extends IDocNodeParameters {
  title: string;
  linkToSource?: string;
}

/**
 * Represents the frontmatter section at the top of a Markdown document.
 *
 * @example
 * ```md
 * ---
 * title: "Page Title"
 * linkToSource: "https://link-to-source.com"
 * ---
 * ```
 */
export class DocFrontmatter extends DocNode {
  public readonly title: string;
  public readonly linkToSource: string | undefined;

  public constructor(parameters: IDocFrontmatterParameters) {
    super(parameters);
    this.title = parameters.title;
    this.linkToSource = parameters.linkToSource;
  }

  public asJson(): string {
    return JSON.stringify({
      title: this.title,
      linkToSource: this.linkToSource,
    });
  }

  /** @override */
  public get kind(): string {
    return CustomDocNodeKind.Frontmatter;
  }
}
