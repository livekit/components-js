/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: 'NO_PREFIX_DEFINED' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Rule(rule) {
      // Regex tests here: regexr.com/6ut26
      const findThis = new RegExp('\\[data-(?=[^\\]])(?!' + opts.prefix + ')');
      const replaceWith = '[data-' + opts.prefix;
      rule.selector = rule.selector.replace(findThis, replaceWith);
      // TODO: Handle cases like `content: attr(data-name);` => `content: attr(data-lk-name);`
    },
  };
};

module.exports.postcss = true;
