import React, {
  HTMLAttributes,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';

import { Participant, Track, TrackPublication } from 'livekit-client';
import { isLocal, setupParticipantMedia } from '@livekit/components-core';
import { mergeProps } from '../utils';
import { ParticipantContext } from '../contexts';

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
};

export const useParticipantMedia = (
  participant: Participant,
  source: Track.Source,
  element?: RefObject<HTMLMediaElement>,
) => {
  const [publication, setPublication] = useState(participant.getTrack(source));
  const [isMuted, setMuted] = useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = useState(publication?.isSubscribed);
  const [track, setTrack] = useState(publication?.track);

  // TODO: refactor from callback to observable.
  const handleUpdate = useCallback(
    (publication: TrackPublication | undefined) => {
      console.log('setting publication', publication);
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    },
    [participant, source],
  );

  const { mediaListener, className } = useMemo(() => setupParticipantMedia(source), [source]);

  useEffect(() => {
    return mediaListener(participant, handleUpdate, element?.current);
  }, [participant, source, element]);

  return { publication, isMuted, isSubscribed, track, className };
};

export const ParticipantView = ({ participant, children, ...htmlProps }: ParticipantProps) => {
  if (!participant) {
    throw Error('need to provide a participant');
  }
  const cameraEl = useRef<HTMLVideoElement>(null);
  const audioEl = useRef<HTMLAudioElement>(null);

  const { className: videoClass, isMuted: videoIsMuted } = useParticipantMedia(
    participant,
    Track.Source.Camera,
    cameraEl,
  );
  const { className: audioClass, isMuted: audioIsMuted } = useParticipantMedia(
    participant,
    Track.Source.Microphone,
    audioEl,
  );

  const mergedProps = useMemo(
    // TODO: move to hook.
    () => mergeProps(htmlProps),

    [videoIsMuted, audioIsMuted, htmlProps],
  );

  return (
    <div
      {...mergedProps}
      style={{ position: 'relative' }}
      data-audio-is-muted={audioIsMuted} // TODO: move data properties into core.
      data-video-is-muted={videoIsMuted}
    >
      <video ref={cameraEl} style={{ width: '100%', height: '100%' }} className={videoClass}>
        <p>child of video</p>
      </video>
      {!isLocal(participant) && <audio ref={audioEl} className={audioClass}></audio>}
      <ParticipantContext.Provider value={participant}>{children}</ParticipantContext.Provider>
    </div>
  );
};
