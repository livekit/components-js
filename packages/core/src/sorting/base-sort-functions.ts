import { Participant } from 'livekit-client';

export function sortParticipantsByAudioLevel(
  a: Pick<Participant, 'audioLevel'>,
  b: Pick<Participant, 'audioLevel'>,
): number {
  return a.audioLevel - b.audioLevel;
}

export function sortParticipantsByIsSpeaking(
  a: Pick<Participant, 'isSpeaking'>,
  b: Pick<Participant, 'isSpeaking'>,
): number {
  if (a.isSpeaking === b.isSpeaking) {
    return 0;
  } else {
    return a.isSpeaking ? 1 : -1;
  }
}

export function sortParticipantsByLastSpokenAT(
  a: Pick<Participant, 'lastSpokeAt'>,
  b: Pick<Participant, 'lastSpokeAt'>,
): number {
  if (a.lastSpokeAt !== undefined || b.lastSpokeAt !== undefined) {
    return (a.lastSpokeAt?.getTime() ?? 0) - (b.lastSpokeAt?.getTime() ?? 0);
  } else {
    return 0;
  }
}
