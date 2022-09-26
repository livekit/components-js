/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: '' }) => {
  const findRegex = new RegExp(`/[data-(?=[^]${opts.prefix}])/g`);
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Root(root, postcss) {
      console.log(' Running Plugin: data-attribute-prefixer');
    },

    Rule(rule) {
      rule.selector = rule.selector.replace(findRegex, `[data-${opts.prefix}`);
    },
  };
};

module.exports.postcss = true;
