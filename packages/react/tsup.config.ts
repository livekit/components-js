import { defineConfig } from 'tsup';

import defaults from '../../tsup.config';

export default defineConfig({
  ...defaults,
  entry: [
    'src/index.ts',
    'src/hooks/index.ts',
    'src/prefabs/index.ts',
    'src/hooks/cloud/krisp/useKrispNoiseFilter.ts',
  ],
  external: ['livekit-client', 'react', 'react-dom', '@livekit/krisp-noise-filter'],
});
