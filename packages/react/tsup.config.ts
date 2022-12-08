import { defineConfig } from 'tsup';

import defaults from '../../tsup.config';

export default defineConfig({
  ...defaults,
  entry: ['src/index.ts', 'src/hooks/index.ts', 'src/prefabs/index.ts'],
  external: ['livekit-client', 'react', 'react-dom'],
});
