import { screenShareObserver, ScreenShareTrackMap } from '@livekit/components-core';
import { Room, Track } from 'livekit-client';
import React, { HTMLAttributes, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '../contexts';

export const useScreenShare = (
  screenEl: RefObject<HTMLVideoElement>,
  audioEl: RefObject<HTMLMediaElement>,
  onScreenShareChange?: (isActive: boolean) => void,
  room?: Room,
) => {
  const [hasActiveScreenShare, setHasActiveScreenShare] = useState(false);
  const currentRoom = room ?? useRoomContext();
  const handleChange = useCallback((map: ScreenShareTrackMap) => {
    console.log('screen share change');
    if (map.length < 1) {
      setHasActiveScreenShare(false);
      onScreenShareChange?.(false);
      return;
    }
    setHasActiveScreenShare(true);
    onScreenShareChange?.(true);

    const { participantId, tracks } = map[map.length - 1];
    console.log({ tracks });
    if (!tracks) return;
    tracks.forEach((tr) => {
      if (tr.source === Track.Source.ScreenShare) {
        if (tr.isSubscribed && screenEl.current) {
          tr.track?.attach(screenEl.current);
        } else if (screenEl.current && !tr.isSubscribed) {
          tr.track?.detach(screenEl.current);
        }
      }
      if (
        tr.source === Track.Source.ScreenShareAudio &&
        participantId !== currentRoom.localParticipant.identity
      ) {
        if (tr.isSubscribed && screenEl.current) {
          tr.track?.attach(screenEl.current);
        } else if (screenEl.current && !tr.isSubscribed) {
          tr.track?.detach(screenEl.current);
        }
      }
    });
  }, []);
  console.log(audioEl);
  useEffect(() => {
    screenShareObserver(currentRoom, handleChange);
  });
  return { hasActiveScreenShare };
};

type ScreenShareProps = HTMLAttributes<HTMLDivElement> & {
  onScreenShareChange?: (active: boolean) => void;
};

export const ScreenShareView = ({
  children,
  onScreenShareChange,
  ...htmlProps
}: ScreenShareProps) => {
  const screenEl = useRef(null);
  const audioEl = useRef(null);
  const { hasActiveScreenShare } = useScreenShare(screenEl, audioEl, onScreenShareChange);

  return (
    <>
      <div {...htmlProps}>
        <video
          ref={screenEl}
          style={{
            width: '100%',
            height: '100%',
            display: hasActiveScreenShare ? 'block' : 'none',
          }}
        ></video>
        <audio ref={audioEl}></audio>
        {children}
      </div>
    </>
  );
};
