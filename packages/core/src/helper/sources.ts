import { Track, Participant } from 'livekit-client';

export const getSourceEnabled = <T extends Participant>(source: Track.Source, participant: T) => {
  let isEnabled = false;
  switch (source) {
    case Track.Source.Camera:
      isEnabled = participant.isCameraEnabled;
      break;
    case Track.Source.Microphone:
      isEnabled = participant.isMicrophoneEnabled;
      break;
    case Track.Source.ScreenShare:
      isEnabled = participant.isScreenShareEnabled;
      break;
    default:
      break;
  }
  return isEnabled;
};
