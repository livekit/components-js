const { info } = require('console');
const fs = require('fs');
const glob = require('glob');

const NAVIGATION_BLOCK = `<!--NAV_START-->
## Monorepo Navigation
* [Home](/README.md)
* **Internals**
    * [Core](/packages/core/README.md)
    * [Styles](/packages/styles/README.md)
* **Docs**
    * [Storybook](/docs/storybook/README.md)
* **Framework Implementations**:
    * [React](/packages/react/README.md)
    * [Vue](/packages/vue/README.md)
<!--NAV_END-->`;

/**
 * Based on the path determine if an link to that path should be annotated with a emoji.
 */
function getNavigationBlock(path) {
  const findThis = new RegExp('\\[(.*)\\](?=\\(/?' + path + '\\))', 'g');
  const updatedNavBlock = NAVIGATION_BLOCK.replaceAll(findThis, '[$1 👈]');
  // if (updatedNavBlock !== NAVIGATION_BLOCK) {
  //   console.log(`Updated nav block for: ${path}`);
  // } else {
  //   console.log(`\t No match was found for regex: ${findThis}`);
  // }
  return updatedNavBlock;
}

/**
 * Replace everything between <!--NAV_START--> and <!--NAV_END--> and write it to file.
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
        console.log(`✅ File ${path} was updated.`);
      });
    } else {
      console.warn(`❗️ Content did't update: ${path}`);
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
