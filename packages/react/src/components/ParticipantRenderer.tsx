import React, {
  createContext,
  HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Participant, Track } from 'livekit-client';
import { isLocal, setupParticipantMedia } from '@livekit/components-core';
import { AudioRenderer, VideoRenderer } from '@livekit/react-core';
// import { AudioRenderer, VideoRenderer } from '@livekit/react-core';

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

export const useParticipantMedia = (participant: Participant, source: Track.Source) => {
  const [publication, setPublication] = useState(participant.getTrack(source));
  const [isMuted, setMuted] = useState(participant.getTrack(source)?.isMuted);
  const [isSubscribed, setSubscribed] = useState(participant.getTrack(source)?.isSubscribed);
  const [track, setTrack] = useState(participant.getTrack(source)?.track);

  const handleUpdate = useCallback(
    (p: Participant) => {
      console.log('setting publication', p.getTrack(source));
      const pub = p.getTrack(source);
      setPublication(pub);
      setMuted(pub?.isMuted);
      setSubscribed(pub?.isSubscribed);
      setTrack(pub?.track);
    },
    [participant, source],
  );

  useEffect(() => {
    const { mediaListener } = setupParticipantMedia(source);
    return mediaListener(participant, handleUpdate);
  }, [participant, source]);

  return { publication, isMuted, isSubscribed, track };
};

export const ParticipantView = ({ participant, children, ...htmlProps }: ParticipantProps) => {
  if (!participant) {
    throw Error('need to provide a participant');
  }
  const camera = useParticipantMedia(participant, Track.Source.Camera);
  const microphone = useParticipantMedia(participant, Track.Source.Microphone);

  const showCam = camera?.isSubscribed && camera?.track && !camera?.isMuted;

  console.log(showCam);

  return (
    <div {...htmlProps}>
      {showCam && camera.track && (
        <VideoRenderer
          track={camera.track}
          isLocal={isLocal(participant)}
          width="100%"
          height="100%"
        />
      )}
      {microphone?.track && (
        <AudioRenderer isLocal={isLocal(participant)} track={microphone?.track} />
      )}
      {children}
    </div>
  );
};
