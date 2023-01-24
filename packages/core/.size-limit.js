module.exports = [
  {
    path: 'dist/index.mjs',
    import: '*',
    ignore: ['tlds', 'email-regex'],
    limit: '13 kB',
  },
];
