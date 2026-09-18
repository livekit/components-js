import React, { HTMLAttributes } from 'react';
import {
  ParticipantContext,
  TrackRefContext,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import { Decorator } from '@storybook/react-vite';
import { Track } from 'livekit-client';

/**
 * Wraps a Storybook Story into a LiveKit participant context.
 *
 * Note: When used as a Storybook decorator, this component has to be used in combination with LkRoomContext.
 * The decorator order matters: `decorators: [LkParticipantContext, LkRoomContext]`
 */
export const LkParticipantContext: Decorator = (Story, _) => {
  return <LocalParticipantContext>{Story()}</LocalParticipantContext>;
};

export const LkLocalMicTrackContext: Decorator = (Story, _) => {
  return <LocalMicTrackContext>{Story()}</LocalMicTrackContext>;
};

const LocalMicTrackContext = (props: HTMLAttributes<HTMLDivElement>) => {
  const p = useTracks([Track.Source.Microphone])[0];

  return p && <TrackRefContext.Provider value={p}>{props.children}</TrackRefContext.Provider>;
};

const LocalParticipantContext = (props: HTMLAttributes<HTMLDivElement>) => {
  const p = useLocalParticipant();

  return (
    <ParticipantContext.Provider value={p.localParticipant}>
      {props.children}
    </ParticipantContext.Provider>
  );
};
