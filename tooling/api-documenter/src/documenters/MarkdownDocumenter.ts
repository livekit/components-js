// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import { PackageName, FileSystem, NewlineKind } from '@rushstack/node-core-library';
import {
  DocSection,
  DocPlainText,
  DocLinkTag,
  TSDocConfiguration,
  StringBuilder,
  DocNodeKind,
  DocParagraph,
  DocCodeSpan,
  DocFencedCode,
  StandardTags,
  DocBlock,
  DocComment,
  DocNodeContainer,
  DocNode,
  DocEscapedText,
} from '@microsoft/tsdoc';
import {
  ApiModel,
  ApiItem,
  ApiEnum,
  ApiPackage,
  ApiItemKind,
  ApiReleaseTagMixin,
  ApiDocumentedItem,
  ApiClass,
  ReleaseTag,
  ApiStaticMixin,
  ApiPropertyItem,
  ApiInterface,
  Excerpt,
  ApiAbstractMixin,
  ApiParameterListMixin,
  ApiReturnTypeMixin,
  ApiDeclaredItem,
  ApiNamespace,
  ExcerptTokenKind,
  IResolveDeclarationReferenceResult,
  ApiTypeAlias,
  ExcerptToken,
  ApiOptionalMixin,
  ApiInitializerMixin,
  ApiProtectedMixin,
  ApiReadonlyMixin,
  IFindApiItemsResult,
  Parameter,
  ApiPropertySignature,
} from '@microsoft/api-extractor-model';

import { CustomDocNodes } from '../nodes/CustomDocNodeKind';
import { DocHeading } from '../nodes/DocHeading';
import { DocTable } from '../nodes/DocTable';
import { DocEmphasisSpan } from '../nodes/DocEmphasisSpan';
import { DocTableRow } from '../nodes/DocTableRow';
import { DocTableCell } from '../nodes/DocTableCell';
import { Utilities } from '../utils/Utilities';
import { CustomMarkdownEmitter } from '../markdown/CustomMarkdownEmitter';
import { PluginLoader } from '../plugin/PluginLoader';
import {
  IMarkdownDocumenterFeatureOnBeforeWritePageArgs,
  MarkdownDocumenterFeatureContext,
} from '../plugin/MarkdownDocumenterFeature';
import { DocumenterConfig } from './DocumenterConfig';
import { MarkdownDocumenterAccessor } from '../plugin/MarkdownDocumenterAccessor';
import {
  LkType,
  getCategorySubfolder,
  getFunctionType,
  getLinkToSourceOnGitHub,
  isNonDefaultOverload,
} from '../livekitUtils/classifiers';
import { MarkDocTag } from '../nodes/MarkDocTag';
import { ParameterList } from '../nodes/ParameterList';
import { ParameterItem } from '../nodes/ParameterItem';
import { Callout } from '../nodes/Callout';
import { DocFrontmatter } from '../nodes/DocFrontmatter';
import { DocMdComment } from '../nodes/DocMdComment';

export interface IMarkdownDocumenterOptions {
  apiModel: ApiModel;
  documenterConfig: DocumenterConfig | undefined;
  outputFolder: string;
}

/**
 * Renders API documentation in the Markdown file format.
 * For more info:  https://en.wikipedia.org/wiki/Markdown
 */
export class MarkdownDocumenter {
  private readonly _apiModel: ApiModel;
  private readonly _documenterConfig: DocumenterConfig | undefined;
  private readonly _tsdocConfiguration: TSDocConfiguration;
  private readonly _markdownEmitter: CustomMarkdownEmitter;
  private readonly _outputFolder: string;
  private readonly _pluginLoader: PluginLoader;

  public constructor(options: IMarkdownDocumenterOptions) {
    this._apiModel = options.apiModel;
    this._documenterConfig = options.documenterConfig;
    this._outputFolder = options.outputFolder;
    this._tsdocConfiguration = CustomDocNodes.configuration;
    this._markdownEmitter = new CustomMarkdownEmitter(this._apiModel);

    this._pluginLoader = new PluginLoader();
  }

  public generateFiles(): void {
    if (this._documenterConfig) {
      this._pluginLoader.load(this._documenterConfig, () => {
        return new MarkdownDocumenterFeatureContext({
          apiModel: this._apiModel,
          outputFolder: this._outputFolder,
          documenter: new MarkdownDocumenterAccessor({
            getLinkForApiItem: (apiItem: ApiItem) => {
              return this._getLinkFilenameForApiItem(apiItem);
            },
          }),
        });
      });
    }

    this._deleteOldOutputFiles();

    this._writeApiItemPage(this._apiModel);

    if (this._pluginLoader.markdownDocumenterFeature) {
      this._pluginLoader.markdownDocumenterFeature.onFinished({});
    }
  }

  private _writeApiItemPage(apiItem: ApiItem): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    const output: DocSection = new DocSection({ configuration });
    const category: LkType = getFunctionType(apiItem);

    if (isNonDefaultOverload(apiItem)) {
      console.log('isNonDefaultOverload', apiItem.displayName);
      return;
    }

    // this._writeBreadcrumb(output, apiItem);

    const scopedName: string = apiItem.getScopedNameWithinPackage();
    let pageTitle: string = scopedName;

    switch (apiItem.kind) {
      case ApiItemKind.Class:
        pageTitle = `${scopedName} class`;
        break;
      case ApiItemKind.Enum:
        pageTitle = `${scopedName} enum`;
        break;
      case ApiItemKind.Interface:
        pageTitle = `${scopedName} interface`;
        break;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
        break;
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
        pageTitle = `${scopedName} method`;
        break;
      case ApiItemKind.Function:
        pageTitle = `${apiItem.displayName}`;
        break;
      case ApiItemKind.Model:
        pageTitle = 'API Reference';
        break;
      case ApiItemKind.Namespace:
        pageTitle = `${scopedName} namespace`;
        break;
      case ApiItemKind.Package:
        console.log(`Writing ${apiItem.displayName} package`);
        const unscopedPackageName: string = PackageName.getUnscopedName(apiItem.displayName);
        pageTitle = `${unscopedPackageName} package`;
        break;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        pageTitle = `${scopedName} property`;
        break;
      case ApiItemKind.TypeAlias:
        pageTitle = `${scopedName} type`;
        break;
      case ApiItemKind.Variable:
        pageTitle = `${scopedName}`;
        break;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }

    output.appendNode(
      new DocFrontmatter({
        configuration,
        title: pageTitle,
        linkToSource: getLinkToSourceOnGitHub(apiItem),
      }),
    );

    output.appendNode(
      new DocMdComment({
        configuration,
        text: 'Do not edit this file. It is automatically generated by API Documenter.',
      }),
    );

    output.appendNode(new DocHeading({ configuration, title: pageTitle, level: 1 }));

    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
      if (apiItem.releaseTag === ReleaseTag.Beta) {
        this._writeBetaWarning(output);
      }
      if (apiItem.releaseTag === ReleaseTag.Alpha) {
        this._writeAlphaWarning(output);
      }
    }

    const decoratorBlocks: DocBlock[] = [];

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        decoratorBlocks.push(
          ...tsdocComment.customBlocks.filter(
            (block) =>
              block.blockTag.tagNameWithUpperCase === StandardTags.decorator.tagNameWithUpperCase,
          ),
        );

        if (tsdocComment.deprecatedBlock) {
          // Render the deprecation message as a "caution" callout add a "deprecated" prefix to the message.
          let addedDeprecationString = false;
          const newContent = tsdocComment.deprecatedBlock.content.nodes.reduce<DocNode[]>(
            (acc, node) => {
              if (!addedDeprecationString && node.kind === DocNodeKind.Paragraph) {
                const paragraphChildren = node
                  .getChildNodes()
                  .reduce<DocNode[]>((paragraphNodes, paraNode) => {
                    if (!addedDeprecationString && paraNode.kind === DocNodeKind.PlainText) {
                      paragraphNodes.push(
                        new DocPlainText({
                          configuration,
                          text: 'This API is deprecated: ' + (paraNode as DocPlainText).text,
                        }),
                      );
                      addedDeprecationString = true;
                    } else {
                      paragraphNodes.push(paraNode);
                    }
                    return paragraphNodes;
                  }, []);
                acc.push(new DocParagraph({ configuration }, paragraphChildren));
              } else {
                acc.push(node);
              }
              return acc;
            },
            [],
          );

          output.appendNode(
            new Callout({ configuration, type: 'caution', variant: 'normal' }, [...newContent]),
          );
        }

        this._appendSection(output, tsdocComment.summarySection);
      }
    }

    /** Write "Import" section. */
    if (apiItem instanceof ApiDeclaredItem) {
      if (category !== undefined) {
        let importPath: string = '';
        try {
          importPath = this._getImportPath(apiItem);
        } catch (error) {
          console.error(error);
        }
        if (importPath) {
          output.appendNode(new DocHeading({ configuration, title: 'Import', level: 2 }));
          output.appendNode(
            new DocFencedCode({
              configuration,
              code: `import {${apiItem.displayName}} from '${importPath}'`,
              language: 'typescript',
            }),
          );
        }
      } else if (apiItem.excerpt.text.length > 0) {
        output.appendNode(
          new DocParagraph({ configuration }, [
            new DocEmphasisSpan({ configuration, bold: true }, [
              new DocPlainText({ configuration, text: 'Signature:' }),
            ]),
          ]),
        );
        output.appendNode(
          new DocFencedCode({
            configuration,
            code: apiItem.getExcerptWithModifiers(),
            language: 'typescript',
          }),
        );
      }

      this._writeHeritageTypes(output, apiItem);
    }

    if (decoratorBlocks.length > 0) {
      output.appendNode(
        new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'Decorators:' }),
          ]),
        ]),
      );
      for (const decoratorBlock of decoratorBlocks) {
        output.appendNodes(decoratorBlock.content.nodes);
      }
    }

    let appendRemarks: boolean = true;
    switch (apiItem.kind) {
      case ApiItemKind.Class:
      case ApiItemKind.Interface:
      case ApiItemKind.Namespace:
      case ApiItemKind.Package:
        this._writeRemarksSection(output, apiItem);
        appendRemarks = false;
        break;
    }

    // Remarks & Example
    if (appendRemarks) {
      this._writeRemarksSection(output, apiItem);
    }

    switch (apiItem.kind) {
      case ApiItemKind.Class:
        this._writeClassTables(output, apiItem as ApiClass);
        break;
      case ApiItemKind.Enum:
        this._writeEnumTables(output, apiItem as ApiEnum);
        break;
      case ApiItemKind.Interface:
        this._writeInterfaceTables(output, apiItem as ApiInterface);
        break;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
      case ApiItemKind.Function:
      case ApiItemKind.Variable:
        // Print property table into component/prefab page.
        if (category === 'component' || category === 'prefab') {
          this._writeComponentPropertyList(output, apiItem as ApiParameterListMixin);
        } else if (category === 'hook') {
          this._writeParameterList(output, apiItem as ApiParameterListMixin);
        }
        this._writeThrowsSection(output, apiItem);
        break;
      case ApiItemKind.Namespace:
        this._writePackageOrNamespaceTables(output, apiItem as ApiNamespace);
        break;
      case ApiItemKind.Model:
        this._writeModelTable(output, apiItem as ApiModel);
        break;
      case ApiItemKind.Package:
        this._writePackageOrNamespaceTables(output, apiItem as ApiPackage);
        break;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        break;
      case ApiItemKind.TypeAlias:
        break;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }

    const filename: string = path.join(this._outputFolder, this._getFilenameForApiItem(apiItem));
    const stringBuilder: StringBuilder = new StringBuilder();

    this._markdownEmitter.emit(stringBuilder, output, {
      contextApiItem: apiItem,
      onGetFilenameForApiItem: (apiItemForFilename: ApiItem) => {
        return this._getLinkFilenameForApiItem(apiItemForFilename);
      },
    });

    let pageContent: string = stringBuilder.toString();

    if (this._pluginLoader.markdownDocumenterFeature) {
      // Allow the plugin to customize the pageContent
      const eventArgs: IMarkdownDocumenterFeatureOnBeforeWritePageArgs = {
        apiItem: apiItem,
        outputFilename: filename,
        pageContent: pageContent,
      };
      this._pluginLoader.markdownDocumenterFeature.onBeforeWritePage(eventArgs);
      pageContent = eventArgs.pageContent;
    }

    FileSystem.writeFile(filename, pageContent, {
      convertLineEndings: this._documenterConfig
        ? this._documenterConfig.newlineKind
        : NewlineKind.CrLf,
      ensureFolderExists: true,
    });
  }

  private _writeHeritageTypes(output: DocSection, apiItem: ApiDeclaredItem): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    if (apiItem instanceof ApiClass) {
      if (apiItem.extendsType) {
        const extendsParagraph: DocParagraph = new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'Extends: ' }),
          ]),
        ]);
        this._appendExcerptWithHyperlinks(extendsParagraph, apiItem.extendsType.excerpt);
        output.appendNode(extendsParagraph);
      }
      if (apiItem.implementsTypes.length > 0) {
        const implementsParagraph: DocParagraph = new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'Implements: ' }),
          ]),
        ]);
        let needsComma: boolean = false;
        for (const implementsType of apiItem.implementsTypes) {
          if (needsComma) {
            implementsParagraph.appendNode(new DocPlainText({ configuration, text: ', ' }));
          }
          this._appendExcerptWithHyperlinks(implementsParagraph, implementsType.excerpt);
          needsComma = true;
        }
        output.appendNode(implementsParagraph);
      }
    }

    if (apiItem instanceof ApiInterface) {
      if (apiItem.extendsTypes.length > 0) {
        const extendsParagraph: DocParagraph = new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'Extends: ' }),
          ]),
        ]);
        let needsComma: boolean = false;
        for (const extendsType of apiItem.extendsTypes) {
          if (needsComma) {
            extendsParagraph.appendNode(new DocPlainText({ configuration, text: ', ' }));
          }
          this._appendExcerptWithHyperlinks(extendsParagraph, extendsType.excerpt);
          needsComma = true;
        }
        output.appendNode(extendsParagraph);
      }
    }

    if (apiItem instanceof ApiTypeAlias) {
      const refs: ExcerptToken[] = apiItem.excerptTokens.filter(
        (token) =>
          token.kind === ExcerptTokenKind.Reference &&
          token.canonicalReference &&
          this._apiModel.resolveDeclarationReference(token.canonicalReference, undefined)
            .resolvedApiItem,
      );
      if (refs.length > 0) {
        const referencesParagraph: DocParagraph = new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'References: ' }),
          ]),
        ]);
        let needsComma: boolean = false;
        const visited: Set<string> = new Set();
        for (const ref of refs) {
          if (visited.has(ref.text)) {
            continue;
          }
          visited.add(ref.text);

          if (needsComma) {
            referencesParagraph.appendNode(new DocPlainText({ configuration, text: ', ' }));
          }

          this._appendExcerptTokenWithHyperlinks(referencesParagraph, ref);
          needsComma = true;
        }
        output.appendNode(referencesParagraph);
      }
    }
  }

  private _writeRemarksSection(output: DocSection, apiItem: ApiItem): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @remarks block
        if (tsdocComment.remarksBlock) {
          output.appendNode(new DocHeading({ configuration, title: 'Remarks', level: 2 }));
          this._appendSection(output, tsdocComment.remarksBlock.content);
        }

        // Write the @example blocks
        const exampleBlocks: DocBlock[] = tsdocComment.customBlocks.filter(
          (x) => x.blockTag.tagNameWithUpperCase === StandardTags.example.tagNameWithUpperCase,
        );

        if (exampleBlocks.length > 0) {
          output.appendNode(new DocHeading({ configuration, title: 'Usage', level: 2 }));
        }

        const findFirstPlainText = (
          node: DocNode,
        ): { text: string | undefined; node: DocPlainText | undefined } => {
          if (node.kind === DocNodeKind.PlainText) {
            const plainTextNode = node as DocPlainText;
            return {
              text: plainTextNode.text.split('\n')[0].trim(),
              node: plainTextNode,
            };
          }

          if (node instanceof DocNodeContainer) {
            for (const childNode of node.getChildNodes()) {
              const result = findFirstPlainText(childNode);
              if (result.text) {
                return result;
              }
            }
          }

          return { text: undefined, node: undefined };
        };

        for (const [index, exampleBlock] of exampleBlocks.entries()) {
          if (exampleBlocks.length > 1) {
            let firstNode: DocNode | undefined = exampleBlock.content.nodes[0];
            let title: string = `Example ${index + 1}`;

            if (firstNode) {
              const { text, node: plainTextNode } = findFirstPlainText(firstNode);
              if (text) {
                title = text;
                if (plainTextNode) {
                  const remainingText: string | undefined = plainTextNode.text
                    .split('\n')
                    .slice(1)
                    .join('\n')
                    .trim();
                  const parent: DocNodeContainer = firstNode as DocNodeContainer;

                  const newChildNodes: DocNode[] = parent
                    .getChildNodes()
                    .map((childNode) => {
                      if (childNode === plainTextNode) {
                        return remainingText
                          ? new DocPlainText({ configuration, text: remainingText })
                          : undefined;
                      }
                      return childNode;
                    })
                    .filter((node): node is DocNode => node !== undefined);

                  firstNode = new DocParagraph({ configuration }, newChildNodes);
                }
              }
            }

            output.appendNode(new DocHeading({ configuration, title, level: 3 }));

            const newContent: DocSection = new DocSection({ configuration });
            if (firstNode && firstNode.getChildNodes().length > 0) {
              newContent.appendNode(firstNode);
            }
            for (let i: number = 1; i < exampleBlock.content.nodes.length; i++) {
              newContent.appendNode(exampleBlock.content.nodes[i]);
            }

            this._appendSection(output, newContent);
          } else {
            this._appendSection(output, exampleBlock.content);
          }
        }
      }
    }
  }

  private _writeThrowsSection(output: DocSection, apiItem: ApiItem): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @throws blocks
        const throwsBlocks: DocBlock[] = tsdocComment.customBlocks.filter(
          (x) => x.blockTag.tagNameWithUpperCase === StandardTags.throws.tagNameWithUpperCase,
        );

        if (throwsBlocks.length > 0) {
          const heading: string = 'Exceptions';
          output.appendNode(new DocHeading({ configuration, title: heading }));

          for (const throwsBlock of throwsBlocks) {
            this._appendSection(output, throwsBlock.content);
          }
        }
      }
    }
  }

  /**
   * GENERATE PAGE: MODEL
   */
  private _writeModelTable(output: DocSection, apiModel: ApiModel): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const packagesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Package', 'Description'],
    });

    for (const apiMember of apiModel.members) {
      const row: DocTableRow = new DocTableRow({ configuration }, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember),
      ]);

      switch (apiMember.kind) {
        case ApiItemKind.Package:
          packagesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (packagesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Packages' }));
      output.appendNode(packagesTable);
    }
  }

  /**
   * GENERATE PAGE: PACKAGE or NAMESPACE
   */
  private _writePackageOrNamespaceTables(
    output: DocSection,
    apiContainer: ApiPackage | ApiNamespace,
  ): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const abstractClassesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Abstract Class', 'Description'],
    });

    const classesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Class', 'Description'],
    });

    const enumerationsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Enumeration', 'Description'],
    });

    const functionsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Function', 'Description'],
    });

    const interfacesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Interface', 'Description'],
    });

    const namespacesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Namespace', 'Description'],
    });

    const variablesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Variable', 'Description'],
    });

    const typeAliasesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Type Alias', 'Description'],
    });

    // Component Table
    const componentsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Component', 'Description'],
    });

    const prefabsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Prefab', 'Description'],
    });
    const hooksTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Hook', 'Description'],
    });

    const restTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Other', 'Description'],
    });

    const apiMembers: ReadonlyArray<ApiItem> =
      apiContainer.kind === ApiItemKind.Package
        ? (apiContainer as ApiPackage).entryPoints[0].members
        : (apiContainer as ApiNamespace).members;

    for (const apiMember of apiMembers) {
      const row: DocTableRow = new DocTableRow({ configuration }, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember),
      ]);

      switch (getFunctionType(apiMember)) {
        case 'component':
          componentsTable.addRow(row);
          break;
        case 'prefab':
          prefabsTable.addRow(row);
          break;
        case 'hook':
          hooksTable.addRow(row);
          break;
        default:
          restTable.addRow(row);
          break;
      }

      switch (apiMember.kind) {
        case ApiItemKind.Class:
          if (ApiAbstractMixin.isBaseClassOf(apiMember) && apiMember.isAbstract) {
            abstractClassesTable.addRow(row);
          } else {
            classesTable.addRow(row);
          }
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Enum:
          enumerationsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Interface:
          interfacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Namespace:
          namespacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Function:
          functionsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.TypeAlias:
          typeAliasesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Variable:
          variablesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (componentsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Components' }));
      output.appendNode(componentsTable);
    }
    if (prefabsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Prefabs' }));
      output.appendNode(prefabsTable);
    }
    if (hooksTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Hooks' }));
      output.appendNode(hooksTable);
    }
    if (restTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Others' }));
      output.appendNode(restTable);
    }

    // if (classesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Classes' }));
    //   output.appendNode(classesTable);
    // }

    // if (abstractClassesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Abstract Classes' }));
    //   output.appendNode(abstractClassesTable);
    // }

    // if (enumerationsTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Enumerations' }));
    //   output.appendNode(enumerationsTable);
    // }
    // if (functionsTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Functions' }));
    //   output.appendNode(functionsTable);
    // }

    // if (interfacesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Interfaces' }));
    //   output.appendNode(interfacesTable);
    // }

    // if (namespacesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Namespaces' }));
    //   output.appendNode(namespacesTable);
    // }

    // if (variablesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Variables' }));
    //   output.appendNode(variablesTable);
    // }

    // if (typeAliasesTable.rows.length > 0) {
    //   output.appendNode(new DocHeading({ configuration, title: 'Type Aliases' }));
    //   output.appendNode(typeAliasesTable);
    // }
  }

  /**
   * GENERATE PAGE: CLASS
   */
  private _writeClassTables(output: DocSection, apiClass: ApiClass): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const eventsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const constructorsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Constructor', 'Modifiers', 'Description'],
    });

    const propertiesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const methodsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Method', 'Modifiers', 'Description'],
    });

    const apiMembers: readonly ApiItem[] = this._getMembersAndWriteIncompleteWarning(
      apiClass,
      output,
    );
    for (const apiMember of apiMembers) {
      const isInherited: boolean = apiMember.parent !== apiClass;
      switch (apiMember.kind) {
        case ApiItemKind.Constructor: {
          constructorsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember, isInherited),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.Method: {
          methodsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember, isInherited),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.Property: {
          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember, isInherited),
              ]),
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember, isInherited),
              ]),
            );
          }

          this._writeApiItemPage(apiMember);
          break;
        }
      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Events' }));
      output.appendNode(eventsTable);
    }

    if (constructorsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Constructors' }));
      output.appendNode(constructorsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Properties', level: 2 }));
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Methods' }));
      output.appendNode(methodsTable);
    }
  }

  /**
   * GENERATE PAGE: ENUM
   */
  private _writeEnumTables(output: DocSection, apiEnum: ApiEnum): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const enumMembersTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Member', 'Value', 'Description'],
    });

    for (const apiEnumMember of apiEnum.members) {
      enumMembersTable.addRow(
        new DocTableRow({ configuration }, [
          new DocTableCell({ configuration }, [
            new DocParagraph({ configuration }, [
              new DocPlainText({
                configuration,
                text: Utilities.getConciseSignature(apiEnumMember),
              }),
            ]),
          ]),
          this._createInitializerCell(apiEnumMember),
          this._createDescriptionCell(apiEnumMember),
        ]),
      );
    }

    if (enumMembersTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Enumeration Members' }));
      output.appendNode(enumMembersTable);
    }
  }

  /**
   * GENERATE PAGE: INTERFACE
   */
  private _writeInterfaceTables(output: DocSection, apiInterface: ApiInterface): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const eventsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const propertiesTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Type', 'Description'],
    });

    const methodsTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Method', 'Description'],
    });

    const apiMembers: readonly ApiItem[] = this._getMembersAndWriteIncompleteWarning(
      apiInterface,
      output,
    );
    for (const apiMember of apiMembers) {
      const isInherited: boolean = apiMember.parent !== apiInterface;
      switch (apiMember.kind) {
        case ApiItemKind.ConstructSignature:
        case ApiItemKind.MethodSignature: {
          methodsTable.addRow(
            new DocTableRow({ configuration }, [
              this._createTitleCell(apiMember),
              this._createDescriptionCell(apiMember, isInherited),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.PropertySignature: {
          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                // this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember, isInherited),
              ]),
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({ configuration }, [
                this._createTitleCell(apiMember),
                // this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember, isInherited),
              ]),
            );
          }

          this._writeApiItemPage(apiMember);
          break;
        }
      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Events' }));
      output.appendNode(eventsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Properties', level: 2 }));
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Methods' }));
      output.appendNode(methodsTable);
    }
  }

  /**
   * GENERATE PAGE: FUNCTION-LIKE
   */
  private _writeParameterTables(
    output: DocSection,
    apiParameterListMixin: ApiParameterListMixin,
  ): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    // console.log({ apiParameterListMixin });
    // console.log({ parent: apiParameterListMixin.parent });
    // console.log({ parameters: apiParameterListMixin.parameters });

    const parametersTable: DocTable = new DocTable({
      configuration,
      headerTitles: ['Parameter', 'Type', 'Description'],
    });
    for (const apiParameter of apiParameterListMixin.parameters) {
      const parameterDescription: DocSection = new DocSection({ configuration });

      if (apiParameter.isOptional) {
        parameterDescription.appendNodesInParagraph([
          new DocEmphasisSpan({ configuration, italic: true }, [
            new DocPlainText({ configuration, text: '(Optional)' }),
          ]),
          new DocPlainText({ configuration, text: ' ' }),
        ]);
      }

      if (apiParameter.tsdocParamBlock) {
        this._appendAndMergeSection(parameterDescription, apiParameter.tsdocParamBlock.content);
      }

      parametersTable.addRow(
        new DocTableRow({ configuration }, [
          new DocTableCell({ configuration }, [
            new DocParagraph({ configuration }, [
              new DocPlainText({ configuration, text: apiParameter.name }),
            ]),
          ]),
          new DocTableCell({ configuration }, [
            this._createParagraphForTypeExcerpt(apiParameter.parameterTypeExcerpt),
          ]),
          new DocTableCell({ configuration }, parameterDescription.nodes),
        ]),
      );
    }

    if (parametersTable.rows.length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Parameters' }));
      output.appendNode(parametersTable);
    }

    if (ApiReturnTypeMixin.isBaseClassOf(apiParameterListMixin)) {
      const returnTypeExcerpt: Excerpt = apiParameterListMixin.returnTypeExcerpt;
      output.appendNode(
        new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, bold: true }, [
            new DocPlainText({ configuration, text: 'Returns:' }),
          ]),
        ]),
      );

      output.appendNode(this._createParagraphForTypeExcerpt(returnTypeExcerpt));

      if (apiParameterListMixin instanceof ApiDocumentedItem) {
        if (apiParameterListMixin.tsdocComment && apiParameterListMixin.tsdocComment.returnsBlock) {
          this._appendSection(output, apiParameterListMixin.tsdocComment.returnsBlock.content);
        }
      }
    }
  }

  /**
   * Create a ParameterList for a function-like API item.
   *
   * @remarks
   * Parameters are the variables that a function accepts.
   * Properties are a special kind of parameter, they are an object passed as the first argument to a function.
   * Attributes are the actual values passed to a function.
   */
  private _writeParameterList(
    output: DocSection,
    apiParameterListMixin: ApiParameterListMixin,
  ): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const parameterList: ParameterList = new ParameterList({ configuration });
    for (const apiParameter of apiParameterListMixin.parameters) {
      const parameterDescription: DocSection = new DocSection({ configuration });
      if (apiParameter.tsdocParamBlock) {
        this._appendAndMergeSection(parameterDescription, apiParameter.tsdocParamBlock.content);
      }
      const firstParameter: ExcerptToken = apiParameter.parameterTypeExcerpt.spannedTokens[0];
      if (
        //@ts-ignore
        // apiParameter?._parent?.displayName === 'useParticipantTile' &&
        firstParameter.kind === ExcerptTokenKind.Reference &&
        (firstParameter.text.endsWith('Props') || firstParameter.text.endsWith('Options')) &&
        firstParameter.canonicalReference
      ) {
        // First parameter is a props object.
        const result: IResolveDeclarationReferenceResult =
          this._apiModel.resolveDeclarationReference(firstParameter.canonicalReference, undefined);

        if (!result.errorMessage) {
          result.resolvedApiItem?.members.forEach((member) => {
            if (member instanceof ApiPropertySignature) {
              parameterList.addParameter(
                new ParameterItem({
                  configuration,
                  attributes: {
                    name: `${apiParameter.name}.${member.displayName}`,
                    type: member.propertyTypeExcerpt.text,
                    optional: member.isOptional,
                    description: member.tsdocComment?.summarySection?.nodes ?? [],
                    deprecated: member.tsdocComment?.deprecatedBlock?.content.nodes,
                  },
                }),
              );
            }
          });
        }
      } else {
        parameterList.addParameter(
          new ParameterItem({
            configuration,
            attributes: {
              name: apiParameter.name,
              type: apiParameter.parameterTypeExcerpt.text,
              optional: apiParameter.isOptional,
              description: parameterDescription.nodes,
            },
          }),
        );
      }
    }

    if (parameterList.getParameters().length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Properties' }));
      output.appendNode(parameterList);
    }

    if (ApiReturnTypeMixin.isBaseClassOf(apiParameterListMixin)) {
      const returnTypeExcerpt: Excerpt = apiParameterListMixin.returnTypeExcerpt;
      output.appendNode(new DocHeading({ configuration, title: 'Returns', level: 2 }));

      if (apiParameterListMixin instanceof ApiDocumentedItem) {
        if (apiParameterListMixin.tsdocComment?.returnsBlock) {
          this._appendSection(output, apiParameterListMixin.tsdocComment.returnsBlock.content);
        }
      }

      const fencedCode: DocFencedCode = new DocFencedCode({
        configuration,
        code: returnTypeExcerpt.text,
        language: 'typescript',
      });

      output.appendNode(fencedCode);
    }
  }

  /**
   * Create a property list for a Component.
   */
  private _writeComponentPropertyList(output: DocSection, apiItem: ApiParameterListMixin): void {
    console.group('Write Component Property List for: ', apiItem.displayName);
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    const parameterList: ParameterList = new ParameterList({ configuration });

    const parameters: ReadonlyArray<Parameter> = apiItem.parameters;

    if (parameters?.length > 0) {
      const props = parameters[0];
      if (props !== undefined) {
        for (const token of props.parameterTypeExcerpt.tokens) {
          if (token.kind === ExcerptTokenKind.Reference && token.canonicalReference) {
            const apiItemResult: IResolveDeclarationReferenceResult =
              this._apiModel.resolveDeclarationReference(token.canonicalReference, undefined);

            const apiInterface: ApiItem | undefined = apiItemResult.resolvedApiItem;
            if (apiInterface) {
              const apiMembers: readonly ApiItem[] = this._getMembersAndWriteIncompleteWarning(
                apiInterface as ApiInterface,
                output,
              );

              for (const apiMember of apiMembers) {
                const isInherited: boolean = apiMember.parent !== apiInterface;
                switch (apiMember.kind) {
                  // case ApiItemKind.ConstructSignature:
                  // case ApiItemKind.MethodSignature: {
                  //   methodsTable.addRow(
                  //     new DocTableRow({ configuration }, [
                  //       this._createTitleCell(apiMember),
                  //       this._createDescriptionCell(apiMember, isInherited),
                  //     ]),
                  //   );

                  //   this._writeApiItemPage(apiMember);
                  //   break;
                  // }
                  case ApiItemKind.PropertySignature: {
                    // if ((apiMember as ApiPropertyItem).isEventProperty) {
                    //   eventsTable.addRow(
                    //     new DocTableRow({ configuration }, [
                    //       this._createTitleCell(apiMember),
                    //       // this._createModifiersCell(apiMember),
                    //       this._createPropertyTypeCell(apiMember),
                    //       this._createDescriptionCell(apiMember, isInherited),
                    //     ]),
                    //   );
                    // } else {
                    if (apiMember as ApiPropertyItem) {
                      let deprecated: readonly DocNode[] | undefined = undefined;
                      if (apiMember instanceof ApiDocumentedItem) {
                        if (apiMember.tsdocComment !== undefined) {
                          deprecated = apiMember.tsdocComment.deprecatedBlock?.content.nodes;
                        }
                      }
                      parameterList.addParameter(
                        new ParameterItem({
                          configuration,
                          attributes: {
                            name: apiMember.displayName,
                            type: (apiMember as ApiPropertyItem).propertyTypeExcerpt.text,
                            optional: (apiMember as ApiPropertyItem).isOptional,
                            description: this._createDescriptionCell(apiMember, isInherited).content
                              .nodes,
                            deprecated,
                          },
                        }),
                      );
                    }
                    // }

                    break;
                  }
                }
              }
            }
          }
        }
      }
      console.groupEnd();
    }

    if (parameterList.getParameters().length > 0) {
      output.appendNode(new DocHeading({ configuration, title: 'Properties' }));
      output.appendNode(parameterList);
    }
  }

  private _createParagraphForTypeExcerpt(excerpt: Excerpt): DocParagraph {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const paragraph: DocParagraph = new DocParagraph({ configuration });

    if (!excerpt.text.trim()) {
      paragraph.appendNode(new DocPlainText({ configuration, text: '(not declared)' }));
    } else {
      this._appendExcerptWithHyperlinks(paragraph, excerpt);
    }

    return paragraph;
  }

  private _appendExcerptWithHyperlinks(docNodeContainer: DocNodeContainer, excerpt: Excerpt): void {
    for (const token of excerpt.spannedTokens) {
      this._appendExcerptTokenWithHyperlinks(docNodeContainer, token);
    }
  }

  private _appendExcerptTokenWithHyperlinks(
    docNodeContainer: DocNodeContainer,
    token: ExcerptToken,
  ): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    // Markdown doesn't provide a standardized syntax for hyperlinks inside code spans, so we will render
    // the type expression as DocPlainText.  Instead of creating multiple DocParagraphs, we can simply
    // discard any newlines and let the renderer do normal word-wrapping.
    const unwrappedTokenText: string = token.text.replace(/[\r\n]+/g, ' ');

    // If it's hyperlinkable, then append a DocLinkTag
    if (token.kind === ExcerptTokenKind.Reference && token.canonicalReference) {
      const apiItemResult: IResolveDeclarationReferenceResult =
        this._apiModel.resolveDeclarationReference(token.canonicalReference, undefined);

      if (apiItemResult.resolvedApiItem) {
        docNodeContainer.appendNode(
          new DocLinkTag({
            configuration,
            tagName: '@link',
            linkText: unwrappedTokenText,
            urlDestination: this._getLinkFilenameForApiItem(apiItemResult.resolvedApiItem),
          }),
        );
        return;
      }
    }

    // Otherwise append non-hyperlinked text
    docNodeContainer.appendNode(new DocPlainText({ configuration, text: unwrappedTokenText }));
  }

  private _createTitleCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    let linkText: string = Utilities.getConciseSignature(apiItem);
    if (ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional) {
      linkText += '?';
    }

    return new DocTableCell({ configuration }, [
      new DocParagraph({ configuration }, [
        new DocLinkTag({
          configuration,
          tagName: '@link',
          linkText: linkText,
          urlDestination: this._getLinkFilenameForApiItem(apiItem),
        }),
      ]),
    ]);
  }

  /**
   * This generates a DocTableCell for an ApiItem including the summary section and "(BETA)" annotation.
   *
   * @remarks
   * We mostly assume that the input is an ApiDocumentedItem, but it's easier to perform this as a runtime
   * check than to have each caller perform a type cast.
   */
  private _createDescriptionCell(apiItem: ApiItem, isInherited: boolean = false): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
      if (apiItem.releaseTag === ReleaseTag.Beta) {
        section.appendNodesInParagraph([
          new DocEmphasisSpan({ configuration, bold: true, italic: true }, [
            new DocPlainText({ configuration, text: '(BETA)' }),
          ]),
          new DocPlainText({ configuration, text: ' ' }),
        ]);
      }
    }

    if (ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional) {
      section.appendNodesInParagraph([
        new DocEmphasisSpan({ configuration, italic: true }, [
          new DocPlainText({ configuration, text: '(Optional)' }),
        ]),
        new DocPlainText({ configuration, text: ' ' }),
      ]);
    }

    if (apiItem instanceof ApiDocumentedItem) {
      if (apiItem.tsdocComment !== undefined) {
        this._appendAndMergeSection(section, apiItem.tsdocComment.summarySection);
      }
    }

    if (isInherited && apiItem.parent) {
      section.appendNode(
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: '(Inherited from ' }),
          new DocLinkTag({
            configuration,
            tagName: '@link',
            linkText: apiItem.parent.displayName,
            urlDestination: this._getLinkFilenameForApiItem(apiItem.parent),
          }),
          new DocPlainText({ configuration, text: ')' }),
        ]),
      );
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _createModifiersCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    // Output modifiers in syntactically correct order: first access modifier (here: `protected`), then
    // `static` or `abstract` (no member can be both, so the order between the two of them does not matter),
    // last `readonly`. If `override` was supported, it would go directly before `readonly`.

    if (ApiProtectedMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isProtected) {
        section.appendNode(
          new DocParagraph({ configuration }, [
            new DocCodeSpan({ configuration, code: 'protected' }),
          ]),
        );
      }
    }

    if (ApiStaticMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isStatic) {
        section.appendNode(
          new DocParagraph({ configuration }, [new DocCodeSpan({ configuration, code: 'static' })]),
        );
      }
    }

    if (ApiAbstractMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isAbstract) {
        section.appendNode(
          new DocParagraph({ configuration }, [
            new DocCodeSpan({ configuration, code: 'abstract' }),
          ]),
        );
      }
    }

    if (ApiReadonlyMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isReadonly) {
        section.appendNode(
          new DocParagraph({ configuration }, [
            new DocCodeSpan({ configuration, code: 'readonly' }),
          ]),
        );
      }
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _createPropertyTypeCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (apiItem instanceof ApiPropertyItem) {
      section.appendNode(this._createParagraphForTypeExcerpt(apiItem.propertyTypeExcerpt));
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _createInitializerCell(apiItem: ApiItem): DocTableCell {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    const section: DocSection = new DocSection({ configuration });

    if (ApiInitializerMixin.isBaseClassOf(apiItem)) {
      if (apiItem.initializerExcerpt) {
        section.appendNodeInParagraph(
          new DocCodeSpan({ configuration, code: apiItem.initializerExcerpt.text }),
        );
      }
    }

    return new DocTableCell({ configuration }, section.nodes);
  }

  private _writeBreadcrumb(output: DocSection, apiItem: ApiItem): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;

    output.appendNodeInParagraph(
      new DocLinkTag({
        configuration,
        tagName: '@link',
        linkText: 'Home',
        urlDestination: this._getLinkFilenameForApiItem(this._apiModel),
      }),
    );

    for (const hierarchyItem of apiItem.getHierarchy()) {
      switch (hierarchyItem.kind) {
        case ApiItemKind.Model:
        case ApiItemKind.EntryPoint:
          // We don't show the model as part of the breadcrumb because it is the root-level container.
          // We don't show the entry point because today API Extractor doesn't support multiple entry points;
          // this may change in the future.
          break;
        default:
          output.appendNodesInParagraph([
            new DocPlainText({
              configuration,
              text: ' > ',
            }),
            new DocLinkTag({
              configuration,
              tagName: '@link',
              linkText: hierarchyItem.displayName,
              urlDestination: this._getLinkFilenameForApiItem(hierarchyItem),
            }),
          ]);
      }
    }
  }

  private _writeBetaWarning(output: DocSection): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    const betaWarning: string =
      'This feature is under active development and may change based on developer feedback and real-world usage.';
    output.appendNode(
      new Callout({ configuration }, [
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: betaWarning }),
        ]),
      ]),
    );
  }

  private _writeAlphaWarning(output: DocSection): void {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    const alphaWarning: string =
      'This feature is experimental and may change or be removed based on developer feedback and real-world usage.';
    output.appendNode(
      new Callout({ configuration }, [
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text: alphaWarning }),
        ]),
      ]),
    );
  }

  private _appendSection(output: DocSection, docSection: DocSection): void {
    for (const node of docSection.nodes) {
      output.appendNode(node);
    }
  }

  private _appendAndMergeSection(output: DocSection, docSection: DocSection): void {
    let firstNode: boolean = true;
    for (const node of docSection.nodes) {
      if (firstNode) {
        if (node.kind === DocNodeKind.Paragraph) {
          output.appendNodesInParagraph(node.getChildNodes());
          firstNode = false;
          continue;
        }
      }
      firstNode = false;

      output.appendNode(node);
    }
  }

  private _getMembersAndWriteIncompleteWarning(
    apiClassOrInterface: ApiClass | ApiInterface,
    output: DocSection,
  ): readonly ApiItem[] {
    const configuration: TSDocConfiguration = this._tsdocConfiguration;
    const showInheritedMembers: boolean = !!this._documenterConfig?.configFile.showInheritedMembers;
    if (!showInheritedMembers) {
      return apiClassOrInterface.members;
    }

    const result: IFindApiItemsResult = apiClassOrInterface.findMembersWithInheritance();

    // If the result is potentially incomplete, write a short warning communicating this.
    if (result.maybeIncompleteResult) {
      output.appendNode(
        new DocParagraph({ configuration }, [
          new DocEmphasisSpan({ configuration, italic: true }, [
            new DocPlainText({
              configuration,
              text: '(Some inherited members may not be shown because they are not represented in the documentation.)',
            }),
          ]),
        ]),
      );
    }

    // Log the messages for diagnostic purposes.
    for (const message of result.messages) {
      console.log(`Diagnostic message for findMembersWithInheritance: ${message.text}`);
    }

    return result.items;
  }

  private _getFilenameForApiItem(apiItem: ApiItem): string {
    if (apiItem.kind === ApiItemKind.Model) {
      return 'index.md';
    }

    let baseName: string = '';
    const subFolder: string = getCategorySubfolder(apiItem);
    for (const hierarchyItem of apiItem.getHierarchy()) {
      // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
      let qualifiedName: string = Utilities.getSafeFilenameForName(hierarchyItem.displayName);
      if (ApiParameterListMixin.isBaseClassOf(hierarchyItem)) {
        if (hierarchyItem.overloadIndex > 1) {
          // Subtract one for compatibility with earlier releases of API Documenter.
          // (This will get revamped when we fix GitHub issue #1308)
          qualifiedName += `_${hierarchyItem.overloadIndex - 1}`;
        }
      }

      switch (hierarchyItem.kind) {
        case ApiItemKind.Model:
        case ApiItemKind.EntryPoint:
        case ApiItemKind.EnumMember:
          break;
        case ApiItemKind.Package:
          // baseName = Utilities.getSafeFilenameForName(
          //   PackageName.getUnscopedName(hierarchyItem.displayName),
          // );
          break;
        default:
          baseName = [baseName, qualifiedName].filter((part) => part !== '').join('.');
      }
    }

    if (baseName === '') {
      baseName = 'index';
    }

    return subFolder + baseName + '.md';
  }

  private _getLinkFilenameForApiItem(apiItem: ApiItem): string {
    return './' + this._getFilenameForApiItem(apiItem);
  }

  private _deleteOldOutputFiles(): void {
    console.log('Deleting old output from ' + this._outputFolder);
    FileSystem.ensureEmptyFolder(this._outputFolder);
  }

  private _getImportPath(apiItem: ApiDeclaredItem): string {
    // Check for custom import path from TSDoc first
    if (apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment) {
      const packageTag: DocBlock | undefined = apiItem.tsdocComment.customBlocks.find(
        (block) => block.blockTag.tagName === '@package',
      );

      if (packageTag) {
        return packageTag.content.nodes
          .map((node) => {
            if (node.kind === DocNodeKind.Paragraph) {
              return node
                .getChildNodes()
                .map((child) => {
                  if (child.kind === DocNodeKind.PlainText) {
                    return (child as DocPlainText).text;
                  } else if (child.kind === DocNodeKind.EscapedText) {
                    return (child as DocEscapedText).decodedText;
                  }
                  return '';
                })
                .join('');
            }
            return '';
          })
          .join('')
          .trim();
      }
    }

    // Fallback to canonical reference
    // @ts-ignore
    return apiItem.canonicalReference.source.escapedPath;
  }
}
