import React from 'react';

import { PreJoin, PreJoinProps } from '@livekit/components-react';
import { StoryObj } from '@storybook/react';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Prefabs/PreJoin',
  component: PreJoin,
  render: (args: PreJoinProps) => <PreJoin {...args} />,
  argTypes: {},
};

export const Default: StoryObj<PreJoinProps> = { args: { defaults: { username: 'Initial Name' } } };
