import React, { HTMLAttributes, useState } from 'react';
import { PinContextProvider } from '../components/PinContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { DefaultControls } from './DefaultControls';
import { FocusViewContainer } from '../components/layout/FocusView';
import { GridView } from '../components/layout/GridView';
import { PinState } from '@livekit/components-core';

export interface DefaultRoomViewProps extends HTMLAttributes<HTMLDivElement> {}

export function DefaultRoomView({ ...props }: DefaultRoomViewProps) {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = useState<Layout>('grid');

  const handlePinStateChange = (pinState: PinState) => {
    setLayout(pinState.pinnedParticipant ? 'focus' : 'grid');
  };

  return (
    <div {...props}>
      <PinContextProvider onChange={handlePinStateChange}>
        {layout === 'grid' ? <GridView /> : <FocusViewContainer />}
      </PinContextProvider>
      <DefaultControls />
      <RoomAudioRenderer />
    </div>
  );
}
