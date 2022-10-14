import React, { useState } from 'react';
import { PinState } from '../../contexts';
import { PinContextProvider } from '../PinContextProvider';
import { RoomAudioRenderer } from '../RoomAudioRenderer';
import { DefaultControls } from './DefaultControls';
import { FocusViewContainer } from './FocusView';
import { GridView } from './GridView';

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
