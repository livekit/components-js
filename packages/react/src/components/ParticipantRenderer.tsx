import React, {
  createContext,
  HTMLAttributes,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Participant, Track, TrackPublication } from 'livekit-client';
import { isLocal, setupParticipantMedia } from '@livekit/components-core';

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
};

const ParticipantContext = createContext<Participant | undefined>(undefined);

export const useParticipantContext = () => {
  const participant = useContext(ParticipantContext);
  if (!participant) {
    throw Error('tried to access participant context outside of participant context provider');
  }
  return participant;
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
  const [className, setClassName] = useState<string | undefined>();

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

  useEffect(() => {
    const { mediaListener, className } = setupParticipantMedia(source);
    setClassName(className);
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

  const { className: videoClass } = useParticipantMedia(participant, Track.Source.Camera, cameraEl);
  const { className: audioClass } = useParticipantMedia(
    participant,
    Track.Source.Microphone,
    audioEl,
  );

  return (
    <div {...htmlProps}>
      <video ref={cameraEl} style={{ width: '100%', height: '100%' }} className={videoClass}>
        <p>child of video</p>
      </video>
      {!isLocal(participant) && <audio ref={audioEl} className={audioClass}></audio>}
      {children}
    </div>
  );
};
