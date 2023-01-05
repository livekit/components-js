import 'regenerator-runtime/runtime';
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as docgen from 'react-docgen-typescript';
import { ComponentDoc } from 'react-docgen-typescript';
import mkdirp from 'mkdirp';
import { mdxComponentTemplate, mdxHookTemplate } from './mdx-template';

type ComponentInfo = {
  def: ComponentDoc;
  displayName: string;
  fileName: string;
  exportName: string;
  importPath: string;
  mdx: string;
};

const globAsync = promisify(glob);

// const excludedPropNames = propNames.concat(['as', 'apply', 'sx', '__css', 'css']);

const rootDir = path.join(__dirname, '..', '..', '..');
const sourcePath = path.join(rootDir, 'packages');
const outputPath = path.join(__dirname, '..', 'dist', 'components');

const basePath = path.join(__dirname, '..', 'dist');

const tsConfigPath = path.join(sourcePath, '..', 'tsconfig.json');

export async function main() {
  const componentFiles = await findComponentFiles();
  if (componentFiles.length) {
    await mkdirp(outputPath);
  }

  log('Parsing files for component types...');
  const parsedInfo = parseInfo(componentFiles);

  log('Extracting component info...');
  const componentInfo = extractComponentInfo(parsedInfo);

  log('Writing component info files...');
  await writeComponentInfoFiles(componentInfo);

  log(`Processed ${componentInfo.length} components`);
}

if (require.main === module) {
  // run main function if called via cli
  main().catch(console.error);
}

/**
 * Find all TypeScript files which could contain component definitions
 */
async function findComponentFiles() {
  return globAsync('**/src/**/*.@(ts|tsx)', {
    cwd: sourcePath,
    ignore: ['**/core/**', '**/node_modules/**', '**/index.ts'],
  });
}

/**
 * Parse files with react-doc-gen-typescript
 */
function parseInfo(filePaths: string[]) {
  const { parse } = docgen.withCustomConfig(tsConfigPath, {
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop, component) => {
      const isHTMLElementProp = prop.parent?.fileName.includes('node_modules') ?? false;
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
function extractComponentInfo(docs: ComponentDoc[]) {
  return docs.reduce((acc, def, _, allDefs) => {
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
      : mdxComponentTemplate(def, hasHook(def.displayName, allDefs));

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

const hasHook = (displayName: string, allDefs: ComponentDoc[]) =>
  allDefs.some((def) => def.displayName === `use${displayName}`);

/**
 * Write component info as JSON to disk
 */
async function writeComponentInfoFiles(componentInfo: ComponentInfo[]) {
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

function log(...args: unknown[]) {
  console.info(`[docs-gen]`, ...args);
}
