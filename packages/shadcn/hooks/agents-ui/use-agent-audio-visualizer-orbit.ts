import {
  type AgentState,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
  useMultibandTrackVolume,
  useTrackVolume,
} from '@livekit/components-react';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';

export const ORBIT_BAND_COUNT = 7;

export function useAgentAudioVisualizerOrbit(
  state: AgentState | undefined,
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder,
  volumeProp?: number,
) {
  const bands = useMultibandTrackVolume(audioTrack, {
    bands: ORBIT_BAND_COUNT,
    loPass: 100,
    hiPass: 200,
  });
  const trackVolume = useTrackVolume(audioTrack as TrackReference);
  const level = volumeProp ?? trackVolume;

  const connected = state !== undefined && state !== 'disconnected';
  const swirl = state === 'thinking' ? 3.2 : state === 'speaking' ? 1.4 : 0.55;
  const breatheFrequency = state === 'listening' || state === 'pre-connect-buffering' ? 1.2 : 2.1;

  return { level, bands, connected, swirl, breatheFrequency };
}
