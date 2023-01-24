module.exports = [
  {
    name: 'Room only',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom }',
    limit: '10 kB',
    ignore: ['@livekit/components-core', 'livekit-client', 'react', 'react-dom'],
  },
  {
    name: 'Room with defaults and core',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom, VideoConference }',
    limit: '50 kB',
    ignore: ['livekit-client', 'react', 'react-dom'],
  },
];
