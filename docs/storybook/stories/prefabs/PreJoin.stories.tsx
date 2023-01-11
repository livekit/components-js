import * as React from 'react';

import { PreJoin, PreJoinProps } from '@livekit/components-react';
import { StoryObj } from '@storybook/react';

export default {
  title: 'Prefabs/PreJoin',
  component: PreJoin,
  render: (args: PreJoinProps) => <PreJoin {...args} />,
  argTypes: {},
};

export const Default: StoryObj<PreJoinProps> = { args: { defaults: { username: 'Initial Name' } } };
