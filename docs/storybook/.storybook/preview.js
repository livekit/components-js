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
    // Ranks agents-ui/Blocks/* ahead of the rest of agents-ui/*, falling back to a plain
    // alphabetical compare everywhere else. A comparator that returns 0 for "unrelated" pairs
    // (relying on sort stability to preserve order) isn't transitive once combined with the
    // strict Blocks-first rule, and Storybook's sort order for a non-transitive comparator is
    // undefined - in practice that showed up as the Blocks group intermittently splitting
    // apart or vanishing from the sidebar across reloads. Always returning a real total order
    // (rank, then title) avoids that.
    storySort: (a, b) => {
      const rank = (title) => {
        if (!title.startsWith('agents-ui/')) return null;
        return title.startsWith('agents-ui/Blocks/') ? 0 : 1;
      };
      const rankA = rank(a.title);
      const rankB = rank(b.title);
      if (rankA !== null && rankB !== null && rankA !== rankB) {
        return rankA - rankB;
      }
      return a.title === b.title ? 0 : a.title.localeCompare(b.title, undefined, { numeric: true });
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
