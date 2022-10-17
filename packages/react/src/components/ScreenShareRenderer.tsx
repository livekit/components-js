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
  const [screenShareTrack, setScreenShareTrack] = useState<TrackPublication | undefined>(undefined);
  const [screenShareParticipant, setScreenShareParticipant] = useState<Participant | undefined>(
    undefined,
  );
  const [allScreenShares, setAllScreenShares] = useState<ScreenShareTrackMap>([]);

  const currentRoom = room ?? useRoomContext();
  const handleChange = useCallback((map: ScreenShareTrackMap) => {
    console.log('screen share change');
    setAllScreenShares(map);
    if (map.length < 1) {
      setHasActiveScreenShare(false);
      setScreenShareParticipant(undefined);
      setScreenShareTrack(undefined);
      onScreenShareChange?.(false);
      return;
    }

    const { participant, tracks } = map[map.length - 1];
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
      // @ts-ignore
      if (tr.source === Track.Source.ScreenShareAudio && !participant.isLocal) {
        if (tr.isSubscribed && screenEl?.current) {
          tr.track?.attach(screenEl.current);
        } else if (screenEl?.current && !tr.isSubscribed) {
          tr.track?.detach(screenEl.current);
        }
      }
    });
    setScreenShareTrack(_latestScreenShareTrack);
    setScreenShareParticipant(participant);
    setHasActiveScreenShare(true);
    onScreenShareChange?.(true, screenShareTrack, screenShareParticipant);
  }, []);
  useEffect(() => {
    const listener = screenShareObserver(currentRoom).subscribe((screenShareMap) =>
      handleChange(screenShareMap),
    );
    return () => listener.unsubscribe();
  }, [currentRoom]);
  return { hasActiveScreenShare, screenShareTrack, screenShareParticipant, allScreenShares };
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
