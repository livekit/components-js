import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';

/** @public */
export const TrackContext = React.createContext<TrackReferenceOrPlaceholder | undefined>(undefined);

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackContext`, an error is thrown.
 * @public
 */
export function useTrackContext() {
  const trackReference = React.useContext(TrackContext);
  if (!trackReference) {
    throw Error('tried to access track context outside of track context provider');
  }
  return trackReference;
}

/**
 * Returns a track reference from the `TrackContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeTrackContext() {
  return React.useContext(TrackContext);
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackContext` and no track reference is provided, an error is thrown.
 * @public
 */
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
