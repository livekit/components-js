import { Participant } from 'livekit-client';
import { isTrackBundle, TrackBundleWithPlaceholder } from '../track-bundle';

export function sortParticipantsByAudioLevel(
  a: Pick<Participant, 'audioLevel'>,
  b: Pick<Participant, 'audioLevel'>,
): number {
  return b.audioLevel - a.audioLevel;
}

export function sortParticipantsByIsSpeaking(
  a: Pick<Participant, 'isSpeaking'>,
  b: Pick<Participant, 'isSpeaking'>,
): number {
  if (a.isSpeaking === b.isSpeaking) {
    return 0;
  } else {
    return a.isSpeaking ? -1 : 1;
  }
}

export function sortParticipantsByLastSpokenAT(
  a: Pick<Participant, 'lastSpokeAt'>,
  b: Pick<Participant, 'lastSpokeAt'>,
): number {
  if (a.lastSpokeAt !== undefined || b.lastSpokeAt !== undefined) {
    return (b.lastSpokeAt?.getTime() ?? 0) - (a.lastSpokeAt?.getTime() ?? 0);
  } else {
    return 0;
  }
}

export function sortTrackBundlesByType(
  a: TrackBundleWithPlaceholder,
  b: TrackBundleWithPlaceholder,
) {
  if (isTrackBundle(a)) {
    if (isTrackBundle(b)) {
      return 0;
    } else {
      return -1;
    }
  } else if (isTrackBundle(b)) {
    return 1;
  } else {
    return 0;
  }
}
