import 'regenerator-runtime/runtime';
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as docgen from 'react-docgen-typescript';
import type { ComponentDoc } from 'react-docgen-typescript';
import mkdirp from 'mkdirp';
import { mdxComponentTemplate, mdxHookTemplate } from './mdx-template';
import { mdComponentTemplate, mdHookTemplate } from './md-templates';

type ComponentInfo = {
  def: ComponentDoc;
  displayName: string;
  fileName: string;
  exportName: string;
  importPath: string;
  mdx: string;
};

type GenInfoMarkdown = {
  def: ComponentDoc;
  displayName: string;
  fileName: string;
  exportName: string;
  isHook: boolean;
  md: string;
};

const TARGET: 'mdx' | 'md' = 'md';
const globAsync = promisify(glob);
const rootDir = path.join(__dirname, '..', '..', '..');
const sourcePath = path.join(rootDir, 'packages');
const outputPath = path.join(__dirname, '..', 'generated');
const tsConfigPath = path.join(sourcePath, '..', 'tsconfig.json');

export async function main() {
  const componentFiles = await findFiles();
  if (componentFiles.length) {
    await mkdirp(outputPath);
  }
  log('Parsing files for component types...');
  log(`Generation TARGET is: ${TARGET}`);
  const parsedInfo = parseInfo(componentFiles);
  log('Extracting component info...');
  if (TARGET === 'md') {
    const componentInfo = extractComponentInfoMd(parsedInfo);
    log('Writing component info files...');
    await writeComponentInfoFilesMd(componentInfo);
    log(`Processed ${componentInfo.length} files.`);
  } else if (TARGET === 'mdx') {
    const componentInfo = extractComponentInfoMdx(parsedInfo);
    log('Writing component info files...');
    await writeComponentInfoFilesMdx(componentInfo);
    log(`Processed ${componentInfo.length} files.`);
  }
}

if (require.main === module) {
  // run main function if called via cli
  main().catch(console.error);
}

/**
 * Find all TypeScript files which could contain component definitions
 */
async function findFiles() {
  return globAsync('**/src/**/*.@(ts|tsx)', {
    cwd: sourcePath,
    ignore: ['**/core/**', '**/node_modules/**', '**/index.ts', '**/assets/**'],
  });
}

/**
 * Parse files with react-doc-gen-typescript
 */
function parseInfo(filePaths: string[]) {
  const { parse } = docgen.withCustomConfig(tsConfigPath, {
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop, component) => {
      const isHTMLElementProp: boolean = prop.parent?.fileName.includes('node_modules') ?? false;
      const isHook = component.name.startsWith('use');
      const isTypeScriptNative = prop.parent?.fileName.includes('node_modules/typescript') ?? false;

      return (isHook && !isTypeScriptNative && !isHTMLElementProp) || !isHTMLElementProp;
    },
  });

  return parse(filePaths.flatMap((file) => path.join(sourcePath, file)));
}

/**
 * Extract meta data of component docs
 */
function extractComponentInfoMdx(docs: ComponentDoc[]) {
  return docs.reduce((acc, def) => {
    function createUniqueName(displayName: string) {
      const existing = acc.filter(
        (prev) => String(prev.def.displayName).toLowerCase() === displayName.toLowerCase(),
      );
      if (!existing.length) {
        return displayName;
      }
      return `${displayName}${existing.length}`;
    }

    const exportName = createUniqueName(def.displayName);
    const fileName = `${exportName}.mdx`;
    const mdx = def.displayName.startsWith('use')
      ? mdxHookTemplate(def)
      : mdxComponentTemplate(def);

    acc.push({
      def,
      displayName: def.displayName,
      fileName,
      exportName,
      importPath: `./components/${fileName}`,
      mdx: mdx,
    });
    return acc;
  }, [] as ComponentInfo[]);
}

/**
 * Extract meta data of component docs
 */
function extractComponentInfoMd(docs: ComponentDoc[]) {
  return docs.reduce((acc, def) => {
    /** Skip if docstring contains @internal tag. */
    if (typeof def.tags === 'object' && Object.keys(def.tags).includes('internal')) {
      return acc;
    }

    function createUniqueName(displayName: string) {
      const existing = acc.filter(
        (prev) => String(prev.def.displayName).toLowerCase() === displayName.toLowerCase(),
      );
      if (!existing.length) {
        return displayName;
      }
      return `${displayName}${existing.length}`;
    }

    const isHook = def.displayName.startsWith('use');
    const exportName = createUniqueName(def.displayName);
    const fileName = `${exportName}.md`;
    const md = isHook ? mdHookTemplate(def) : mdComponentTemplate(def);

    acc.push({
      def,
      displayName: def.displayName,
      fileName,
      exportName,
      isHook,
      md: md,
    });
    return acc;
  }, [] as GenInfoMarkdown[]);
}

// const hasHook = (displayName: string, allDefs: ComponentDoc[]) =>
//   allDefs.some((def) => def.displayName === `use${displayName}`);

/**
 * Write doc files as .mdx files.
 */
async function writeComponentInfoFilesMdx(componentInfo: ComponentInfo[]) {
  return Promise.all(
    componentInfo.map(async (info) => {
      const componentDirPath = path.join(outputPath);
      const filePath = path.join(componentDirPath, info.fileName);
      const content = info.mdx;
      await mkdirp(componentDirPath);
      return fs.writeFile(filePath, content);
    }),
  );
}

/**
 * Write doc files as .md files.
 */
async function writeComponentInfoFilesMd(componentInfo: GenInfoMarkdown[]) {
  return Promise.all(
    componentInfo.map(async (info) => {
      const dirPath = path.join(outputPath, 'markdown', info.isHook ? 'hooks' : 'components');
      const filePath = path.join(dirPath, info.fileName);
      const content = info.md;
      await mkdirp(dirPath);
      return fs.writeFile(filePath, content);
    }),
  );
}

function log(...args: unknown[]) {
  console.info(`[docs-gen]`, ...args);
}
