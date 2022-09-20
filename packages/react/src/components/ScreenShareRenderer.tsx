import { screenShareObserver, ScreenShareTrackMap } from '@livekit/components-core';
import { Participant, Room, Track, TrackPublication } from 'livekit-client';
import React, { HTMLAttributes, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '../contexts';

type ScreenShareOptions = {
  screenEl?: RefObject<HTMLVideoElement>;
  audioEl?: RefObject<HTMLMediaElement>;
  onScreenShareChange?: (
    isActive: boolean,
    publication?: TrackPublication,
    participant?: Participant,
  ) => void;
  room?: Room;
};
export const useScreenShare = ({ room, onScreenShareChange, screenEl }: ScreenShareOptions) => {
  const [hasActiveScreenShare, setHasActiveScreenShare] = useState(false);
  const [latestScreenShareTrack, setLatestScreenShareTrack] = useState<
    TrackPublication | undefined
  >(undefined);

  const currentRoom = room ?? useRoomContext();
  const handleChange = useCallback((map: ScreenShareTrackMap) => {
    console.log('screen share change');
    if (map.length < 1) {
      setHasActiveScreenShare(false);
      onScreenShareChange?.(false);
      return;
    }

    const { participantId, tracks } = map[map.length - 1];
    if (!tracks) return;
    let _latestScreenShareTrack: TrackPublication | undefined;
    tracks.forEach((tr) => {
      if (tr.source === Track.Source.ScreenShare) {
        if (tr.isSubscribed) {
          if (screenEl?.current) {
            tr.track?.attach(screenEl.current);
          }
          _latestScreenShareTrack = tr;
        } else if (screenEl?.current && !tr.isSubscribed) {
          tr.track?.detach(screenEl.current);
        }
      }
      if (
        tr.source === Track.Source.ScreenShareAudio &&
        participantId !== currentRoom.localParticipant.identity
      ) {
        if (tr.isSubscribed && screenEl?.current) {
          tr.track?.attach(screenEl.current);
        } else if (screenEl?.current && !tr.isSubscribed) {
          tr.track?.detach(screenEl.current);
        }
      }
    });
    setLatestScreenShareTrack(_latestScreenShareTrack);
    setHasActiveScreenShare(true);
    onScreenShareChange?.(
      true,
      _latestScreenShareTrack,
      currentRoom.getParticipantByIdentity(participantId),
    );
  }, []);
  useEffect(() => {
    const listener = screenShareObserver(currentRoom).subscribe((screenShareMap) =>
      handleChange(screenShareMap),
    );
    return () => listener.unsubscribe();
  });
  return { hasActiveScreenShare, latestScreenShareTrack };
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
  const { hasActiveScreenShare } = useScreenShare({ screenEl, audioEl, onScreenShareChange });

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
