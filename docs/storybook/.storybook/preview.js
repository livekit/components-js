// @ts-check
/** Imports styles for all stories. Maybe this is not what we want.
 *  You can also import styles on a per story level. */
import '@livekit/components-styles';
// import '@livekit/components-styles/dist/general/layout.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
