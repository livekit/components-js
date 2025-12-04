import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import {
  ConnectionQualityIndicator,
  ConnectionQualityIndicatorProps,
} from '@livekit/components-react';
import { MockParticipantContext } from '../../../.storybook/lk-decorators';
import { ConnectionQuality } from 'livekit-client';

const Story: Meta<typeof ConnectionQualityIndicator> = {
  /*
   * This is some docs for connection quality
   */
  component: ConnectionQualityIndicator,
  decorators: [MockParticipantContext],
  render: (args: ConnectionQualityIndicatorProps) => <ConnectionQualityIndicator {...args} />,
  argTypes: {
    // @ts-ignore the arg will be used from within the MockParticipantContext
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

export default Story;

export const Default: StoryObj<ConnectionQualityIndicatorProps> = {};
