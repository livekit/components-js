import React from 'react';
import { RoomAudioRenderer } from '../RoomAudioRenderer';
import { GridView, GridViewProps } from './GridView';

export function DefaultRoomView(props: GridViewProps) {
  return (
    <>
      <GridView {...props} />
      <RoomAudioRenderer />
    </>
  );
}
