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
  options: {
    storySort: (a, b) => {
      const AGENTS_UI_PREFIX = 'agents-ui/';
      const BLOCKS_PREFIX = 'agents-ui/Blocks/';
      const aIsAgentsUi = a.title.startsWith(AGENTS_UI_PREFIX);
      const bIsAgentsUi = b.title.startsWith(AGENTS_UI_PREFIX);
      if (!aIsAgentsUi || !bIsAgentsUi) return 0;

      const aIsBlock = a.title.startsWith(BLOCKS_PREFIX);
      const bIsBlock = b.title.startsWith(BLOCKS_PREFIX);
      if (aIsBlock === bIsBlock) return 0;

      return aIsBlock ? -1 : 1;
    },
  },
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
