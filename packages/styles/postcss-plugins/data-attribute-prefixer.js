/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: '' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Rule(rule) {
      // Regex tests here: regexr.com/6ut26
      rule.selector = rule.selector.replace(
        `[data-(?=[^]])(?!${opts.prefix})`,
        `[data-${opts.prefix}`,
      );
    },
  };
};

module.exports.postcss = true;
