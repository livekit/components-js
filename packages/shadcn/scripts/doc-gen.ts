import { type ComponentDoc, withDefaultConfig, type PropItem } from 'react-docgen-typescript';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });

const agentsUiPath = path.join(__dirname, '../components/agents-ui');
const blocksPath = path.join(agentsUiPath, 'blocks');

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('Generating documentation for components/agents-ui');

const topLevelFiles = fs
  .readdirSync(agentsUiPath)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => path.join(agentsUiPath, f));
const blocksFiles = fs.existsSync(blocksPath)
  ? getAllTsxFiles(blocksPath).filter((filePath) =>
      path.basename(filePath, '.tsx').endsWith('-block'),
    )
  : [];
const files = [...topLevelFiles, ...blocksFiles];
const parser = withDefaultConfig({
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  shouldExtractValuesFromUnion: false,
  skipChildrenPropWithoutDoc: false,
  propFilter: (prop: PropItem) => {
    if (prop.name === 'key' && prop.type?.name === 'Key') {
      return false;
    }
    if (prop.declarations !== undefined && prop.declarations.length > 0) {
      return prop.declarations.some((declaration) => {
        return (
          declaration.name !== 'MotionProps' &&
          declaration.name !== 'DOMAttributes' &&
          declaration.name !== 'AriaAttributes' &&
          !declaration.name.endsWith('HTMLAttributes') &&
          !declaration.fileName.includes('/motion-dom') &&
          !declaration.fileName.includes('/class-variance-authority')
        );
      });
    }
    return true;
  },
});

console.log(`Found ${files.length} files`);

const docs: Record<string, ComponentDoc> = {};
for (const filePath of files) {
  const fileName = path.basename(filePath, '.tsx');
  console.log(`Generating documentation for ${fileName}`);
  const documentation = parser.parse(filePath);

  for (const doc of documentation) {
    if (doc.displayName) {
      docs[doc.displayName] = doc;
    }
  }
}

console.log('--------------------------------');
console.log(`Writing prop-types.json to ${path.join(__dirname, '../dist', 'prop-types.json')}`);

fs.writeFileSync(
  path.join(__dirname, '../dist', 'prop-types.json'),
  JSON.stringify(docs, null, 2) + '\n',
);
console.log('--------------------------------');
console.log('Done');
