const PREFIX = 'lk';

module.exports = {
  plugins: [
    require('postcss-prefixer')({
      prefix: `${PREFIX}-`,
    }),
    require('postcss-variables-prefixer')({
      prefix: `${PREFIX}-`,
    }),
    require('./postcss-plugins/data-attribute-prefixer')({ prefix: `${PREFIX}-` }),
  ],
};
