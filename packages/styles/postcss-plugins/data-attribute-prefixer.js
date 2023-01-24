/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = { prefix: 'NO_PREFIX_DEFINED' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Rule(rule) {
      const findThis = new RegExp('\\[data-(?=[^\\]])(?!' + opts.prefix + ')', 'g');
      const replaceWith = '[data-' + opts.prefix;
      rule.selector = rule.selector.replaceAll(findThis, replaceWith);
    },
    Declaration(declaration) {
      const findThis = new RegExp('attr\\(data-(?=[^\\)])(?!' + opts.prefix + ')', 'g');
      const replaceWith = 'attr(data-' + opts.prefix;
      declaration.value = declaration.value.replaceAll(findThis, replaceWith);
    },
  };
};

module.exports.postcss = true;
