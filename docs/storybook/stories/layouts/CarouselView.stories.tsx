import React from 'react';

import { CarouselView, CarouselViewProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: CarouselView,
  decorators: [LkRoomContext],
  render: (args: CarouselViewProps) => <CarouselView {...args} />,
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
