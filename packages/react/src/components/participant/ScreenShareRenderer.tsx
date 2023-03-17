import { log, screenShareObserver, ScreenShareTrackMap } from '@livekit/components-core';
import { Participant, Room, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useEnsureRoom } from '../../context';

type ScreenShareOptions = {
  screenEl?: React.RefObject<HTMLVideoElement>;
  audioEl?: React.RefObject<HTMLMediaElement>;
  onScreenShareChange?: (
    isActive: boolean,
    publication?: TrackPublication,
    participant?: Participant,
  ) => void;
  room?: Room;
};
export const useScreenShare = ({
  room: passedRoom,
  onScreenShareChange,
  screenEl,
}: ScreenShareOptions) => {
  const [hasActiveScreenShare, setHasActiveScreenShare] = React.useState(false);
  const [screenShareTrack, setScreenShareTrack] = React.useState<TrackPublication | undefined>(
    undefined,
  );
  const [screenShareParticipant, setScreenShareParticipant] = React.useState<
    Participant | undefined
  >(undefined);
  const [allScreenShares, setAllScreenShares] = React.useState<ScreenShareTrackMap>([]);
  const room = useEnsureRoom(passedRoom);
  if (!room) {
    throw new Error('no room provided');
  }

  const handleChange = React.useCallback((map: ScreenShareTrackMap) => {
    log.debug('screen share change', map);
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
  React.useEffect(() => {
    const listener = screenShareObserver(room).subscribe((screenShareMap: ScreenShareTrackMap) =>
      handleChange(screenShareMap),
    );
    return () => listener.unsubscribe();
  }, [room]);
  return {
    hasActiveScreenShare,
    screenShareTrack,
    screenShareParticipant,
    allScreenShares,
  };
};

type ScreenShareProps = React.HTMLAttributes<HTMLDivElement> & {
  onScreenShareChange?: (active: boolean) => void;
};

export const ScreenShareView = ({
  children,
  onScreenShareChange,
  ...htmlProps
}: ScreenShareProps) => {
  const screenEl = React.useRef(null);
  const audioEl = React.useRef(null);
  const { hasActiveScreenShare } = useScreenShare({
    screenEl,
    audioEl,
    onScreenShareChange,
  });

  return (
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
  );
};
