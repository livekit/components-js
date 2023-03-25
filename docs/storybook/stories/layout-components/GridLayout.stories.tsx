import * as React from 'react';

import { GridLayout, GridLayoutProps, useTracks } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';
import { Track } from 'livekit-client';

export default {
  component: GridLayout,
  decorators: [LkRoomContext],
  render: (args: Omit<GridLayoutProps, 'tracks'>) => {
    const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
    return <GridLayout tracks={tracks} {...args} />;
  },
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
