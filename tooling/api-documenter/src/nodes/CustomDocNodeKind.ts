import { TSDocConfiguration, DocNodeKind } from '@microsoft/tsdoc';
import { DocEmphasisSpan } from './DocEmphasisSpan';
import { DocHeading } from './DocHeading';
import { DocNoteBox } from './DocNoteBox';
import { DocTable } from './DocTable';
import { DocTableCell } from './DocTableCell';
import { DocTableRow } from './DocTableRow';
import { MarkDocTag } from './MarkDocTag';
import { ParameterList } from './ParameterList';
import { ParameterItem } from './ParameterItem';
import { Callout } from './Callout';
import { DocMdComment } from './DocMdComment';
import { DocFrontmatter } from './DocFrontmatter';

// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/**
 * Identifies custom subclasses of {@link DocNode}.
 */
export const enum CustomDocNodeKind {
  EmphasisSpan = 'EmphasisSpan',
  Heading = 'Heading',
  NoteBox = 'NoteBox',
  Table = 'Table',
  TableCell = 'TableCell',
  TableRow = 'TableRow',
  MarkDocTag = 'MarkDocTag',
  ParameterList = 'ParameterList',
  ParameterItem = 'ParameterItem',
  Callout = 'Callout',
  MdComment = 'MdComment',
  Frontmatter = 'Frontmatter',
}

export class CustomDocNodes {
  private static _configuration: TSDocConfiguration | undefined;

  public static get configuration(): TSDocConfiguration {
    if (CustomDocNodes._configuration === undefined) {
      const configuration: TSDocConfiguration = new TSDocConfiguration();

      configuration.docNodeManager.registerDocNodes('@micrososft/api-documenter', [
        { docNodeKind: CustomDocNodeKind.EmphasisSpan, constructor: DocEmphasisSpan },
        { docNodeKind: CustomDocNodeKind.Heading, constructor: DocHeading },
        { docNodeKind: CustomDocNodeKind.NoteBox, constructor: DocNoteBox },
        { docNodeKind: CustomDocNodeKind.Callout, constructor: Callout },
        { docNodeKind: CustomDocNodeKind.Table, constructor: DocTable },
        { docNodeKind: CustomDocNodeKind.TableCell, constructor: DocTableCell },
        { docNodeKind: CustomDocNodeKind.TableRow, constructor: DocTableRow },
        { docNodeKind: CustomDocNodeKind.MarkDocTag, constructor: MarkDocTag },
        { docNodeKind: CustomDocNodeKind.ParameterList, constructor: ParameterList },
        { docNodeKind: CustomDocNodeKind.ParameterItem, constructor: ParameterItem },
        { docNodeKind: CustomDocNodeKind.Frontmatter, constructor: DocFrontmatter },
        { docNodeKind: CustomDocNodeKind.MdComment, constructor: DocMdComment },
      ]);

      configuration.docNodeManager.registerAllowableChildren(CustomDocNodeKind.EmphasisSpan, [
        DocNodeKind.PlainText,
        DocNodeKind.SoftBreak,
      ]);

      configuration.docNodeManager.registerAllowableChildren(DocNodeKind.Section, [
        CustomDocNodeKind.Heading,
        CustomDocNodeKind.NoteBox,
        CustomDocNodeKind.Callout,
        CustomDocNodeKind.Table,
        CustomDocNodeKind.MarkDocTag,
        CustomDocNodeKind.ParameterList,
        CustomDocNodeKind.Frontmatter,
        CustomDocNodeKind.MdComment,
      ]);

      configuration.docNodeManager.registerAllowableChildren(DocNodeKind.Paragraph, [
        CustomDocNodeKind.EmphasisSpan,
      ]);

      CustomDocNodes._configuration = configuration;
    }
    return CustomDocNodes._configuration;
  }
}
