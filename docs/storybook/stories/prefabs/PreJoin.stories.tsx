import * as React from 'react';

import { PreJoin, PreJoinProps } from '@livekit/components-react';
import { StoryObj } from '@storybook/react-vite';

export default {
  title: 'Prefabs/PreJoin',
  component: PreJoin,
  render: (args: PreJoinProps) => (
    <div data-lk-theme="default">
      <PreJoin {...args} />
    </div>
  ),
  argTypes: {},
};

export const Default: StoryObj<PreJoinProps> = { args: { defaults: { username: 'Initial Name' } } };
