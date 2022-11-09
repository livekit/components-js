// @ts-check
/** Imports styles for all stories. Maybe this is not what we want.
 *  You can also import styles on a per story level. */
import '@livekit/components-styles';
import '@livekit/components-styles/layout';

export const parameters = {
  viewMode: 'docs',
  backgrounds: {
    default: 'white',
    values: [
      { name: 'white', value: '#fff' },
      { name: 'black', value: '#000' },
    ],
  },
  controls: { expanded: false },
};
