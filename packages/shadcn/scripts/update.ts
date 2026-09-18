import { execSync } from 'node:child_process';

// copy .env.example to .env.local and edit DEST_REGISTRY_PATH
if (!process.env.DEST_REGISTRY_PATH) {
  throw new Error('DEST_REGISTRY_PATH is not set');
}

console.log('--------------------------------');
console.log(`Cleaning ${process.env.DEST_REGISTRY_PATH}`);
execSync(`rm -rf ${process.env.DEST_REGISTRY_PATH}/*`);
console.log('--------------------------------');
console.log(`Copying dist/r to ${process.env.DEST_REGISTRY_PATH}`);
execSync(`cp -r dist/r/* ${process.env.DEST_REGISTRY_PATH}`);

if (!process.env.DEST_PROP_TYPES_PATH) {
  throw new Error('DEST_PROP_TYPES_PATH is not set');
}

console.log('--------------------------------');
console.log(`Copying dist/prop-types.json to ${process.env.DEST_PROP_TYPES_PATH}`);
execSync(`cp dist/prop-types.json ${process.env.DEST_PROP_TYPES_PATH}`);
console.log('--------------------------------');

console.log('Done');
