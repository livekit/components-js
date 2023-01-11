import * as React from 'react';
import { StoryObj } from '@storybook/react';

import {
  ConnectionQualityIndicator,
  ConnectionQualityIndicatorProps,
} from '@livekit/components-react';
import { MockParticipantContext } from '../../.storybook/lk-decorators';
import { ConnectionQuality } from 'livekit-client';

export default {
  /*
   * This is some docs for connection quality
   */
  component: ConnectionQualityIndicator,
  decorators: [MockParticipantContext],
  render: (args: ConnectionQualityIndicatorProps) => <ConnectionQualityIndicator {...args} />,
  argTypes: {
    connectionQuality: {
      control: { type: 'select' },
      options: [
        ConnectionQuality.Excellent,
        ConnectionQuality.Good,
        ConnectionQuality.Poor,
        ConnectionQuality.Unknown,
      ],
      default: ConnectionQuality.Excellent,
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
    docs: {
      page: null,
    },
  },
};

export const Default: StoryObj<ConnectionQualityIndicatorProps> = {};
