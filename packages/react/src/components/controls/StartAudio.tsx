import { setupStartAudio } from '@livekit/components-core';
import { Room } from 'livekit-client';
import React, { HTMLAttributes, useMemo } from 'react';
import { useRoomContext } from '../../contexts';
import { mergeProps, useObservableState } from '../../utils';

const useStartAudio = (room: Room, props: HTMLAttributes<HTMLButtonElement>) => {
  const { className, roomAudioPlaybackAllowedObservable, handleStartAudioPlayback } = useMemo(
    () => setupStartAudio(),
    [room],
  );

  const { canPlayAudio } = useObservableState(
    roomAudioPlaybackAllowedObservable(room),
    { canPlayAudio: false },
    [roomAudioPlaybackAllowedObservable],
  );

  const mergedProps = useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: () => {
          handleStartAudioPlayback(room);
        },
        style: { display: canPlayAudio ? 'none' : 'block' },
      }),
    [props, canPlayAudio],
  );

  return { mergedProps, canPlayAudio };
};
interface AllowAudioPlaybackProps extends HTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const StartAudio = ({ label, ...props }: AllowAudioPlaybackProps) => {
  const room = useRoomContext();
  const { mergedProps } = useStartAudio(room, props);

  return <button {...mergedProps}>Allow Audio</button>;
};
