module.exports = [
  {
    name: 'Room only',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom }',
    limit: '10 kB',
    ignore: ['livekit-client', 'react', 'react-dom'],
  },
  {
    name: 'Room with defaults',
    path: 'dist/index.mjs',
    import: '{ LiveKitRoom, VideoConference }',
    limit: '50 kB',
    ignore: ['livekit-client', 'react', 'react-dom'],
  },
];
