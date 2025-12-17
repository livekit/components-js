import { execSync } from 'node:child_process';

// copy .env.example to .env.local and edit DEST_PATH
if (!process.env.DEST_PATH) {
  throw new Error('DEST_PATH is not set');
}

console.log('--------------------------------');
console.log(`Cleaning ${process.env.DEST_PATH}`);
execSync(`rm -rf ${process.env.DEST_PATH}/*`);
console.log('--------------------------------');
console.log(`Copying dist to ${process.env.DEST_PATH}`);
execSync(`cp -r dist/* ${process.env.DEST_PATH}`);
console.log('--------------------------------');

console.log('Done');
