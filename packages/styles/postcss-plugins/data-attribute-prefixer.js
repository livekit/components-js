/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: 'NO_PREFIX_DEFINED' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Rule(rule) {
      // Regex tests here: regexr.com/6ut26
      const findThis = new RegExp('\\[data-(?=[^\\]])(?!' + opts.prefix + ')', 'g');
      const replaceWith = '[data-' + opts.prefix;
      rule.selector = rule.selector.replaceAll(findThis, replaceWith);
    },
  };
};

module.exports.postcss = true;
