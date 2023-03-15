import * as React from 'react';

import { CarouselView, CarouselViewProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: CarouselView,
  decorators: [LkRoomContext],
  render: (args: CarouselViewProps) => (
    <div style={{ width: '100%', height: '100%', maxHeight: '100%' }}>
      <CarouselView {...args} />
    </div>
  ),
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: [undefined, 'vertical', 'horizontal'],
    },
  },
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
