import * as React from 'react';

import { VideoConference, VideoConferenceProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: VideoConference,
  decorators: [LkRoomContext],
  render: (args: VideoConferenceProps) => <VideoConference {...args} />,
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
