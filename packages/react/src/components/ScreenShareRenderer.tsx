import { screenShareObserver, ScreenShareTrackMap } from '@livekit/components-core';
import { Room, Track } from 'livekit-client';
import React, { HTMLAttributes, RefObject, useEffect, useRef, useState } from 'react';
import { useRoomContext } from './LiveKitRoom';

export const useScreenShare = (
  screenEl: RefObject<HTMLVideoElement>,
  audioEl: RefObject<HTMLMediaElement>,
  room?: Room,
) => {
  const [hide, setHide] = useState(true);
  const currentRoom = room ?? useRoomContext();
  const handleChange = (map: ScreenShareTrackMap) => {
    console.log('screen share change');
    if (map.length < 1) {
      setHide(true);
      return;
    }
    setHide(false);
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
  };
  console.log(audioEl);
  useEffect(() => {
    screenShareObserver(currentRoom, handleChange);
  });
  return { hide };
};

export const ScreenShareView = ({ children, ...htmlProps }: HTMLAttributes<HTMLDivElement>) => {
  const screenEl = useRef(null);
  const audioEl = useRef(null);
  const { hide } = useScreenShare(screenEl, audioEl);

  return (
    <div {...htmlProps}>
      <video
        ref={screenEl}
        style={{ width: '100%', height: '100%', display: hide ? 'none' : 'block' }}
      ></video>
      <audio ref={audioEl}></audio>
      {children}
    </div>
  );
};
