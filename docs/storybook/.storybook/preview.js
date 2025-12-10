// @ts-check
/** Imports styles for all stories. Maybe this is not what we want.
 *  You can also import styles on a per story level. */
import '@livekit/components-styles';
import './tailwind.css';

import { withNextThemes } from './lk-decorators/withNextThemes';

export const parameters = {
  viewMode: 'docs',
  controls: { expanded: false },
  layout: 'fullscreen',
};

export const globalTypes = {
  participantCount: {
    name: 'Participant count',
    defaultValue: '9',
    toolbar: {
      /**
       * You can check all available icons by this link:
       * https://storybook.js.org/docs/riot/workflows/faq#what-icons-are-available-for-my-toolbar-or-my-addon
       */
      icon: 'circlehollow',
      items: ['1', '2', '3', '4', '9', '12', '15', '16', '17', '25', '26', '30'],
      // Should "Container size" be shown, or just the "circlehollow" icon
      showName: true,
    },
  },
};

export const decorators = [
  withNextThemes({
    themes: {
      light: '',
      dark: 'dark',
      system: 'system',
    },
    defaultTheme: 'system',
    // All next-themes properties can be configured directly here
    enableSystem: true,
    disableTransitionOnChange: true,
    attribute: 'class',
  }),
];
