import React, { useState } from 'react';
import { PinState } from '../contexts';
import { PinContextProvider } from '../components/PinContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { DefaultControls } from './DefaultControls';
import { FocusViewContainer } from '../components/layout/FocusView';
import { GridView } from '../components/layout/GridView';

export function DefaultRoomView() {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = useState<Layout>('grid');

  const handlePinStateChange = (pinState: PinState) => {
    setLayout(pinState.pinnedParticipant ? 'focus' : 'grid');
  };

  return (
    <>
      <PinContextProvider onChange={handlePinStateChange}>
        {layout === 'grid' ? <GridView /> : <FocusViewContainer />}
      </PinContextProvider>
      <DefaultControls />
      <RoomAudioRenderer />
    </>
  );
}
