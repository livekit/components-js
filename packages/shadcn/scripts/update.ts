import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHADCN_PKG_DIR = path.join(__dirname, '..');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

const destRegistryPath = requireEnv('DEST_REGISTRY_PATH');
const destPropTypesPath = requireEnv('DEST_PROP_TYPES_PATH');
const registrySourcePath = path.join(SHADCN_PKG_DIR, 'dist/r');
const propTypesSourcePath = path.join(SHADCN_PKG_DIR, 'dist/prop-types.json');

function assertSafeCleanTarget(targetPath: string): void {
  const resolvedPath = path.resolve(targetPath);
  if (
    resolvedPath === path.parse(resolvedPath).root ||
    resolvedPath === SHADCN_PKG_DIR ||
    resolvedPath === path.dirname(SHADCN_PKG_DIR)
  ) {
    throw new Error(`Refusing to clean unsafe DEST_REGISTRY_PATH: ${targetPath}`);
  }
}

console.log('--------------------------------');
console.log(`Cleaning ${destRegistryPath}`);
assertSafeCleanTarget(destRegistryPath);
fs.mkdirSync(destRegistryPath, { recursive: true });
for (const entry of fs.readdirSync(destRegistryPath)) {
  fs.rmSync(path.join(destRegistryPath, entry), { recursive: true, force: true });
}

console.log('--------------------------------');
console.log(`Copying dist/r to ${destRegistryPath}`);
fs.cpSync(registrySourcePath, destRegistryPath, { recursive: true });

console.log('--------------------------------');
console.log(`Copying dist/prop-types.json to ${destPropTypesPath}`);
fs.mkdirSync(path.dirname(destPropTypesPath), { recursive: true });
fs.copyFileSync(propTypesSourcePath, destPropTypesPath);
console.log('--------------------------------');

console.log('Done');
