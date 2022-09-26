/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: '' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Root(root, postcss) {
      console.log(' Running Plugin: data-attribute-prefixer');
    },

    Rule(rule) {
      rule.selector = rule.selector.replace(/\[data-(?=[^\]])/g, `[data-${opts.prefix}`);
    },
  };
};

module.exports.postcss = true;
