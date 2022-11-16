import 'regenerator-runtime/runtime';
import path from 'path';
import { promises as fs } from 'fs';
import mkdirp from 'mkdirp';
import { allComponentProps, PropDoc } from '@livekit/components-props-docs';

interface ComponentInfo extends PropDoc {
  mdx: string;
  fileName: string;
}

const outputPath = path.join(__dirname, '..', 'dist', 'components');

export async function main() {
  log('Extracting component info...');
  const componentInfo = extractComponentInfo(allComponentProps);

  log('Writing component info files...');
  await writeComponentInfoFiles(componentInfo);

  log(`Processed ${componentInfo.length} components`);
}

if (require.main === module) {
  // run main function if called via cli
  main().catch(console.error);
}

/**
 * Extract meta data of component docs
 */
function extractComponentInfo(docs: PropDoc[]) {
  const splitCamelCase = (camelCaseStr: string) =>
    camelCaseStr.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  return docs.reduce((acc, def) => {
    if (!Object.keys(def.props || {}).length) {
      return acc;
    }

    function createUniqueName(displayName: string) {
      const existing = acc.filter(
        (prev) => String(prev.displayName).toLowerCase() === displayName.toLowerCase(),
      );

      if (!existing.length) {
        return displayName;
      }

      return `${displayName}${existing.length}`;
    }

    const exportName = createUniqueName(def.displayName);
    const fileName = `${exportName}.mdx`;

    const mdx = `---
title: ${splitCamelCase(def.displayName)}
subtitle: ${def.description} 
---

import Usage from "@/components/js-components/Usage"
import PropsTable from "@/components/js-components/PropsTable"

## Import

${def.tags?.examples}

## Usage

<Usage of='${def.displayName}' />

## Props

<PropsTable data='${JSON.stringify(def.props)}' />
`;

    acc.push({
      ...def,
      mdx,
      fileName,
    });
    return acc;
  }, [] as ComponentInfo[]);
}

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
