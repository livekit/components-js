import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';

export const TrackContext = React.createContext<TrackReferenceOrPlaceholder | undefined>(undefined);

export function useTrackContext() {
  const participant = React.useContext(TrackContext);
  if (!participant) {
    throw Error('tried to access track context outside of track context provider');
  }
  return participant;
}

export function useMaybeTrackContext() {
  return React.useContext(TrackContext);
}

export function useEnsureTrackReference(track?: TrackReferenceOrPlaceholder) {
  const context = useMaybeTrackContext();
  const trackRef = track ?? context;
  if (!trackRef) {
    throw new Error(
      'No participant provided, make sure you are inside a participant context or pass the participant explicitly',
    );
  }
  return trackRef;
}
