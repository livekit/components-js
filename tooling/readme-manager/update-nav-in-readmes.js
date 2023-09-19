/**
 * This file contains some tools to update common content in all README.md files in this monorepo.
 *
 * ## Usage
 * Update NAVIGATION_BLOCK and YOU_ARE_HERE_ICON and
 * then from project root run it with: `node path/to-this/file.js`.
 */
const fs = require('fs');
const glob = require('glob');

const YOU_ARE_HERE_ICON = '👈';
const NAVIGATION_BLOCK = `<!--NAV_START-->

## Monorepo Navigation

- [Home](/README.md)
- **Framework Implementations**:
  - [React](/packages/react/README.md)
- **Examples**
  - [Next.js](/examples/nextjs/README.md)
- **Internal Packages**
  - [Core](/packages/core/README.md)
  - [Styles](/packages/styles/README.md)

<!--NAV_END-->`;

/**
 * Based on the path, determine whether a link to that path should have an emoji.
 */
function getNavigationBlock(path) {
  const findThis = new RegExp('\\[(.*)\\](?=\\(/?' + path + '\\))', 'g');
  let updatedNavBlock = NAVIGATION_BLOCK.replaceAll(findThis, `[$1 ${YOU_ARE_HERE_ICON}]`);

  // Make links relative to monorepo root so that links work also outside GitHub (e.g. https://www.npmjs.com/package/@livekit/components-react).
  const levelsDeep = path.split('/').length - 1;
  const prefixToMakeRelative = new Array(levelsDeep).fill('..').join('/');

  const findNavEntry = new RegExp('(\\[.*\\])\\((.*)\\)', 'g');
  const relativeNavBlock = updatedNavBlock.replaceAll(
    findNavEntry,
    `$1(${prefixToMakeRelative}$2)`,
  );
  return relativeNavBlock;
}

/**
 * Replace everything between <!--NAV_START--> and <!--NAV_END--> with NAVIGATION_BLOCK and write it to file.
 */
function replaceNavigationBlock(path) {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) throw err;
    getNavigationBlock(path);
    const findThis = new RegExp('<!--NAV_START-->((.|\\n)*?)<!--NAV_END-->', 'g');
    const newContent = data.replaceAll(findThis, getNavigationBlock(path));
    if (data !== newContent) {
      fs.writeFile(path, newContent, 'utf-8', (err) => {
        if (err) throw err;
        console.info(`✅ File ${path} was updated.`);
      });
    } else {
      console.info(
        `❗️ The file was not updated because no changes were detected after the script run: ${path}`,
      );
    }
  });
}

function main() {
  console.info(
    '\nUpdate navigation blocks in all README.md files...\n---------------------------------------------\n',
  );
  glob('**/README.md', { ignore: ['**/node_modules/**/*', '**/dist/**/*'] }, (err, files) => {
    console.log(`📝 Files matching Regex (count ${files.length}):\n`, files);
    if (err) throw err;
    files.map((path) => {
      replaceNavigationBlock(path);
    });
  });
}

main();
