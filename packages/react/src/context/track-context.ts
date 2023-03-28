import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';

export const TrackContext = React.createContext<TrackReferenceOrPlaceholder | undefined>(undefined);

export function useTrackContext() {
  const trackReference = React.useContext(TrackContext);
  if (!trackReference) {
    throw Error('tried to access track context outside of track context provider');
  }
  return trackReference;
}

export function useMaybeTrackContext() {
  return React.useContext(TrackContext);
}

export function useEnsureTrackReference(track?: TrackReferenceOrPlaceholder) {
  const context = useMaybeTrackContext();
  const trackRef = track ?? context;
  if (!trackRef) {
    throw new Error(
      'No TrackReference provided, make sure you are inside a track context or pass the track reference explicitly',
    );
  }
  return trackRef;
}
