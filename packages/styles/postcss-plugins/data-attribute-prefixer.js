/**
 *
 * @type {import('postcss').PluginCreator}
 */
module.exports = (options = { prefix: 'NO_PREFIX_DEFINED' }) => {
  return {
    postcssPlugin: 'data-attribute-prefixer',
    Rule(rule) {
      const findThis = new RegExp('\\[data-(?=[^\\]])(?!' + options.prefix + ')', 'g');
      const replaceWith = '[data-' + options.prefix;
      rule.selector = rule.selector.replaceAll(findThis, replaceWith);
    },
    Declaration(declaration) {
      const findThis = new RegExp('attr\\(data-(?=[^\\)])(?!' + options.prefix + ')', 'g');
      const replaceWith = 'attr(data-' + options.prefix;
      declaration.value = declaration.value.replaceAll(findThis, replaceWith);
    },
  };
};

module.exports.postcss = true;
