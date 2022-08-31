import { LocalParticipant, Track } from 'livekit-client';
import { getCSSClassName } from '../utils';

export function setupToggle() {
  const toggle = async (
    source: Track.Source,
    localParticipant: LocalParticipant,
    onEnableChange?: (enabled: boolean) => void,
    onPendingChange?: (pending: boolean) => void,
  ) => {
    let isMediaEnabled = false;
    try {
      onPendingChange?.(true);
      switch (source) {
        case Track.Source.Camera:
          await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
          isMediaEnabled = localParticipant.isCameraEnabled;
          break;
        case Track.Source.Microphone:
          await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
          isMediaEnabled = localParticipant.isMicrophoneEnabled;
          break;
        case Track.Source.ScreenShare:
          await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
          isMediaEnabled = localParticipant.isScreenShareEnabled;
          break;
        default:
          break;
      }
    } finally {
      onPendingChange?.(false);
      onEnableChange?.(isMediaEnabled);
    }
  };
  return { className: getCSSClassName('media-toggle'), toggle };
}
