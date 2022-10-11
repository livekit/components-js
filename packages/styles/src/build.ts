import * as convert from 'js-to-css-generator';
import * as styles from './styles';

const file: convert.File = {
  name: 'styles.css',
  module: styles as Record<string, any>,
};

const cssFile = convert.jsToCss(file);

// @ts-ignore
console.log(cssFile.css);
