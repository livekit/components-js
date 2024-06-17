// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiParameterListMixin, ApiItem } from '@microsoft/api-extractor-model';
import { isHook } from '../livekitUtils';

export class Utilities {
  private static readonly _badFilenameCharsRegExp: RegExp = /[^a-z0-9_\-\.]/gi;
  /**
   * Generates a concise signature for a function.  Example: "getArea(width, height)"
   */
  public static getConciseSignature(apiItem: ApiItem): string {
    if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
      return apiItem.displayName + '(' + apiItem.parameters.map((x) => x.name).join(', ') + ')';
    }
    return apiItem.displayName;
  }

  /**
   * Converts bad filename characters to underscores.
   */
  public static getSafeFilenameForName(name: string): string {
    // TODO: This can introduce naming collisions.
    // We will fix that as part of https://github.com/microsoft/rushstack/issues/1308
    return name.replace(Utilities._badFilenameCharsRegExp, '_').toLowerCase();
  }

  /**
   * removes overloaded hook definitions from a list of ApiItems so that only the first function definition remains
   */
  public static dedupeApiItems(items: readonly ApiItem[]): ApiItem[] {
    const dedupedItems: ApiItem[] = items.reduce((acc, val) => {
      if (!acc.some((item) => isHook(val) && item.displayName === val.displayName)) {
        acc.push(val);
      }
      return acc;
    }, [] as ApiItem[]);
    return dedupedItems;
  }
}
