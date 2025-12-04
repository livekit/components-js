import * as React from 'react';

import { CarouselLayout, CarouselLayoutProps } from '@livekit/components-react';
import { LkRoomContext } from '../../../.storybook/lk-decorators';
import { Meta } from '@storybook/react-vite';

const Story: Meta<typeof CarouselLayout> = {
  component: CarouselLayout,
  decorators: [LkRoomContext],
  render: (args: CarouselLayoutProps) => (
    <div style={{ width: '100%', height: '100%', maxHeight: '100%' }}>
      <CarouselLayout {...args} />
    </div>
  ),
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: [undefined, 'vertical', 'horizontal'],
    },
  },
};

export default Story;

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
