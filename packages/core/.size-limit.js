module.exports = [
  {
    path: 'dist/index.mjs',
    import: '{ setupLiveKitRoom }',
    ignore: ['global-tld-list', 'email-regex'],
    limit: '13 kB',
  },
];
