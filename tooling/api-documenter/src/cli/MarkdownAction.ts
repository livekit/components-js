// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiDocumenterCommandLine } from './ApiDocumenterCommandLine';
import { BaseAction } from './BaseAction';
import { MarkdownDocumenter } from '../documenters/MarkdownDocumenter';
import glob from 'fast-glob';
import path from 'path';
import { readFile } from 'fs/promises';
import fs from 'fs';

export class MarkdownAction extends BaseAction {
  public constructor(parser: ApiDocumenterCommandLine) {
    super({
      actionName: 'markdown',
      summary: 'Generate documentation as Markdown files (*.md)',
      documentation:
        'Generates API documentation as a collection of files in' +
        ' Markdown format, suitable for example for publishing on a GitHub site.',
    });
  }

  protected async onExecute(): Promise<void> {
    // override
    const { apiModel, outputFolder } = this.buildApiModel();

    const markdownDocumenter: MarkdownDocumenter = new MarkdownDocumenter({
      apiModel,
      documenterConfig: undefined,
      outputFolder,
    });
    markdownDocumenter.generateFiles();

    await generate_metadata(outputFolder);
  }
}

// TODO: Implement this in a plugin instead here.
async function generate_metadata(dir: string): Promise<void> {
  interface IFileMetaData {
    title: string;
    filename: string;
  }

  const componentFiles: string[] = await glob(`${dir}/react/component/*.md`);
  componentFiles.sort();
  const components: IFileMetaData[] = [];
  for (const file of componentFiles) {
    const filename: string = path.basename(file);
    const title: string | undefined = await getTitle(file);
    components.push({ filename, title: title || filename });
  }

  const hookFiles: string[] = await glob(`${dir}/react/hook/*.md`);
  hookFiles.sort();
  const hooks: IFileMetaData[] = [];
  for (const file of hookFiles) {
    const filename: string = path.basename(file);
    const title: string | undefined = await getTitle(file);
    hooks.push({ filename, title: title || filename });
  }

  const metadata: { components: IFileMetaData[]; hooks: IFileMetaData[] } = {
    components,
    hooks,
  };
  fs.writeFile(`${dir}/react/meta-data.json`, JSON.stringify(metadata), (err) => {
    console.error(err);
  });
}

async function getTitle(filePath: string): Promise<string | undefined> {
  try {
    const contents: string = await readFile(filePath, { encoding: 'utf8' });
    // Extract the first h1 header using a regex
    const h1Regex: RegExp = /^#\s(.+)$/m;
    const match: RegExpExecArray | null = h1Regex.exec(contents);
    return match && match.length > 0 ? match[1] : undefined;
  } catch (err) {
    console.error(err.message);
    return undefined;
  }
}
